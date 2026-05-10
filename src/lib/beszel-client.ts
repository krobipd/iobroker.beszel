import * as http from "node:http";
import * as https from "node:https";
import { URL } from "node:url";
import {
  coerceAuthResponse,
  coerceContainer,
  coercePocketBaseList,
  coerceSystem,
  coerceSystemStatsRecord,
  errText,
} from "./coerce";
import type { BeszelContainer, BeszelSystem, SystemStats } from "./types";

const TOKEN_REFRESH_MS = 23 * 60 * 60 * 1000; // 23 hours
const DEFAULT_TIMEOUT_MS = 15_000;
/**
 * v0.4.3 (B2): pagination size per page. PocketBase caps perPage at 500;
 * we use 200 and follow `totalPages` to fetch the rest.
 */
const PAGE_SIZE = 200;
/** Defensive cap on pagination round-trips (50 × 200 = 10 000 records). */
const MAX_PAGES = 50;

/**
 * HTTP client for the Beszel PocketBase REST API.
 * Uses only Node.js built-in http/https — no extra dependencies.
 */
export class BeszelClient {
  private readonly baseUrl: string;
  private readonly username: string;
  private readonly password: string;

  private token: string | null = null;
  private tokenTime = 0;
  /**
   * v0.4.3 (B1): in-flight authenticate-promise so concurrent requests
   * share a single auth round-trip.
   */
  private authInFlight: Promise<void> | null = null;
  /** v0.4.3 (B5): per-request timeout in ms (default 15 s). */
  private readonly timeoutMs: number;
  /**
   * v0.4.3 (B8): set of in-flight `AbortController`s. `cancelAll()` aborts
   * every running request — called from `onUnload`.
   */
  private readonly inflight = new Set<AbortController>();

  /**
   * @param url Beszel Hub base URL, e.g. http://192.168.1.100:8090
   * @param username Login username
   * @param password Login password
   * @param timeoutMs Per-request HTTP timeout in milliseconds (default 15 000)
   */
  constructor(url: string, username: string, password: string, timeoutMs = DEFAULT_TIMEOUT_MS) {
    // Strip trailing slash
    this.baseUrl = url.replace(/\/+$/, "");
    this.username = username;
    this.password = password;
    this.timeoutMs = timeoutMs > 0 ? timeoutMs : DEFAULT_TIMEOUT_MS;
  }

  /** Force token re-authentication on the next request */
  public invalidateToken(): void {
    this.token = null;
    this.tokenTime = 0;
  }

  /**
   * v0.4.3 (B8): abort every in-flight request. Called from `onUnload`
   * so a slow Hub doesn't keep the adapter alive past js-controller's
   * 4-second kill deadline.
   */
  public cancelAll(): void {
    for (const ctrl of this.inflight) {
      ctrl.abort();
    }
  }

  /**
   * Test the connection to Beszel.
   * Returns { success: true } or { success: false, message: reason }.
   */
  public async checkConnection(): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      this.invalidateToken();
      await this.authenticate();
      return { success: true, message: "Connected successfully" };
    } catch (err) {
      return { success: false, message: errText(err) };
    }
  }

  /** Fetch all systems (paginated, B2 v0.4.3) */
  public async getSystems(): Promise<BeszelSystem[]> {
    await this.ensureToken();
    const items = await this.fetchAllPages("/api/collections/systems/records?sort=name", coerceSystem);
    return items.filter((s): s is BeszelSystem => s !== null);
  }

  /**
   * Fetch the latest 1m stats per system.
   * Returns a Map<systemId, SystemStats>.
   *
   * v0.4.3 (B7+M3): no longer takes a `systemIds` array — the API call
   * doesn't filter on it server-side. Removing the param lets the caller
   * fetch this concurrently with `getSystems()`.
   *
   * v0.4.3 (B2): paginated so big setups (200+ systems) aren't truncated.
   */
  public async getLatestStats(): Promise<Map<string, SystemStats>> {
    await this.ensureToken();
    const items = await this.fetchAllPages(
      "/api/collections/system_stats/records?sort=-updated&filter=type%3D'1m'",
      coerceSystemStatsRecord,
    );
    // Deduplicate: keep the newest record per system
    const result = new Map<string, SystemStats>();
    for (const record of items) {
      if (record && !result.has(record.system)) {
        result.set(record.system, record.stats);
      }
    }
    return result;
  }

  /** Fetch all containers (paginated, B2 v0.4.3) */
  public async getContainers(): Promise<BeszelContainer[]> {
    await this.ensureToken();
    const items = await this.fetchAllPages("/api/collections/containers/records?sort=system%2Cname", coerceContainer);
    return items.filter((c): c is BeszelContainer => c !== null);
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private async ensureToken(): Promise<void> {
    const now = Date.now();
    if (this.token && now - this.tokenTime < TOKEN_REFRESH_MS) {
      return;
    }
    if (this.authInFlight) {
      await this.authInFlight;
      return;
    }
    this.authInFlight = this.authenticate().finally(() => {
      this.authInFlight = null;
    });
    await this.authInFlight;
  }

  private async authenticate(): Promise<void> {
    const body = JSON.stringify({
      identity: this.username,
      password: this.password,
    });

    const raw = await this.request<unknown>(
      "POST",
      "/api/collections/users/auth-with-password",
      body,
      null, // no auth token yet
    );

    const auth = coerceAuthResponse(raw);
    if (auth === null) {
      const err = new Error("Auth response missing valid token");
      (err as NodeJS.ErrnoException).code = "INVALID_AUTH_RESPONSE";
      throw err;
    }
    this.token = auth.token;
    this.tokenTime = Date.now();
  }

  private async fetchJson<T>(path: string): Promise<T> {
    return this.request<T>("GET", path, null, this.token);
  }

  /**
   * v0.4.3 (B2): walk every PocketBase page and accumulate the items.
   * Stops at `MAX_PAGES` defensively. Splits `path` on `?` so we can
   * always append our own `page=` and `perPage=`.
   *
   * @param path The collection-records path (with or without query string).
   * @param itemCoercer Per-item coercer; `null` items are dropped by the caller.
   */
  private async fetchAllPages<T>(path: string, itemCoercer: (raw: unknown) => T | null): Promise<(T | null)[]> {
    const sep = path.includes("?") ? "&" : "?";
    const out: (T | null)[] = [];
    let totalPages = 1;
    for (let page = 1; page <= Math.min(totalPages, MAX_PAGES); page++) {
      const pagedPath = `${path}${sep}page=${page}&perPage=${PAGE_SIZE}`;
      const raw = await this.fetchJson<unknown>(pagedPath);
      const list = coercePocketBaseList(raw, itemCoercer);
      out.push(...list.items);
      totalPages = list.totalPages > 0 ? list.totalPages : 1;
      if (list.items.length === 0) {
        break;
      }
    }
    return out;
  }

  private async request<T>(method: string, path: string, body: string | null, token: string | null): Promise<T> {
    // v0.4.3 (B3): one transparent retry on 429 honouring `Retry-After`.
    try {
      return await this.requestOnce<T>(method, path, body, token);
    } catch (err) {
      const e = err as NodeJS.ErrnoException & { retryAfter?: number };
      if (e.code !== "RATE_LIMITED") {
        throw err;
      }
      const retrySec = e.retryAfter ?? 1;
      const sleep = Math.min(Math.max(1, retrySec), 30) * 1000;
      await new Promise(resolve => setTimeout(resolve, sleep));
      return this.requestOnce<T>(method, path, body, token);
    }
  }

  private requestOnce<T>(method: string, path: string, body: string | null, token: string | null): Promise<T> {
    return new Promise((resolve, reject) => {
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(this.baseUrl + path);
      } catch {
        reject(new Error(`Invalid URL: ${this.baseUrl + path}`));
        return;
      }

      const isHttps = parsedUrl.protocol === "https:";
      const transport = isHttps ? https : http;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };
      if (token) {
        // Beszel/PocketBase wants the bare token without "Bearer " prefix
        // (verified in Ressourcen/beszel/api-referenz.md:23).
        headers.Authorization = token;
      }
      if (body !== null) {
        headers["Content-Length"] = Buffer.byteLength(body).toString();
      }

      const options: http.RequestOptions = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method,
        headers,
        timeout: this.timeoutMs,
      };

      // v0.4.3 (B8): per-request AbortController so `cancelAll()` can abort
      // everything pending without waiting for the configured timeout.
      const ctrl = new AbortController();
      this.inflight.add(ctrl);
      const cleanup = (): void => {
        this.inflight.delete(ctrl);
      };

      const req = transport.request(options, res => {
        const chunks: Buffer[] = [];
        res.on("error", err => {
          cleanup();
          reject(err);
        });
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => {
          cleanup();
          const raw = Buffer.concat(chunks).toString("utf8");
          if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
            const err = new Error(`HTTP ${res.statusCode ?? "?"}: ${raw.slice(0, 200)}`) as NodeJS.ErrnoException & {
              retryAfter?: number;
            };
            // v0.4.3 (B3+B4'): distinct error classes — 401 reauth, 429 backoff,
            // 403 perms hint, anything else generic.
            if (res.statusCode === 401) {
              err.code = "UNAUTHORIZED";
            } else if (res.statusCode === 429) {
              err.code = "RATE_LIMITED";
              const ra = res.headers["retry-after"];
              if (typeof ra === "string") {
                const n = parseInt(ra, 10);
                if (Number.isFinite(n) && n > 0) {
                  err.retryAfter = n;
                }
              }
            } else if (res.statusCode === 403) {
              err.code = "FORBIDDEN";
            } else {
              err.code = "HTTP_ERROR";
            }
            reject(err);
            return;
          }
          try {
            resolve(JSON.parse(raw) as T);
          } catch {
            reject(new Error(`Invalid JSON response from ${path}`));
          }
        });
      });

      ctrl.signal.addEventListener("abort", () => {
        req.destroy(new Error("Request aborted"));
      });

      req.on("timeout", () => {
        req.destroy();
        cleanup();
        reject(new Error(`Request to ${path} timed out`));
      });

      req.on("error", err => {
        cleanup();
        reject(err);
      });

      if (body !== null) {
        req.write(body);
      }
      req.end();
    });
  }
}

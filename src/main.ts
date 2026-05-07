import * as utils from "@iobroker/adapter-core";
import { BeszelClient } from "./lib/beszel-client";
import { errText } from "./lib/coerce";
import { tLog } from "./lib/i18n-logs";
import { StateManager } from "./lib/state-manager";
import type { AdapterConfig } from "./lib/types";

class BeszelAdapter extends utils.Adapter {
  private client: BeszelClient | null = null;
  private stateManager: StateManager | null = null;
  private pollTimer: ioBroker.Interval | undefined = undefined;
  private isPolling = false;
  private lastSystemCount = 0;
  private lastErrorCode = "";
  private authFailCount = 0;
  private failedSystems = new Set<string>();
  private unhandledRejectionHandler: ((reason: unknown) => void) | null = null;
  private uncaughtExceptionHandler: ((err: Error) => void) | null = null;
  private systemLang: string = "en";

  public constructor(options: Partial<utils.AdapterOptions> = {}) {
    super({
      ...options,
      name: "beszel",
    });
    // Wrap async handlers with .catch() so a rejection can never become an
    // unhandled promise rejection (→ SIGKILL → js-controller restart loop).
    this.on("ready", () => {
      this.onReady().catch((err: unknown) =>
        this.log.error(tLog(this.systemLang, "onReadyFailed", { error: errText(err) })),
      );
    });
    this.on("unload", this.onUnload.bind(this));
    this.on("message", obj => {
      this.onMessage(obj).catch((err: unknown) =>
        this.log.error(tLog(this.systemLang, "onMessageFailed", { error: errText(err) })),
      );
    });
    // Last-line-of-defence against unhandled rejections / sync throws from
    // fire-and-forget paths (e.g. `void this.poll()`). The per-handler
    // .catch() wrappers cover the documented async paths; this catches
    // anything that slips past during refactors.
    this.unhandledRejectionHandler = (reason: unknown) => {
      this.log.error(tLog(this.systemLang, "unhandledRejection", { error: errText(reason) }));
    };
    this.uncaughtExceptionHandler = (err: Error) => {
      this.log.error(tLog(this.systemLang, "uncaughtException", { error: errText(err) }));
    };
    process.on("unhandledRejection", this.unhandledRejectionHandler);
    process.on("uncaughtException", this.uncaughtExceptionHandler);
  }

  private async onReady(): Promise<void> {
    const config = this.config as unknown as AdapterConfig;

    // Read ioBroker system language once; admin language change requires a
    // restart, which is acceptable — users don't switch on the fly.
    try {
      const sys = await this.getForeignObjectAsync("system.config");
      const lang = sys?.common?.language;
      if (typeof lang === "string" && lang.length > 0) {
        this.systemLang = lang;
      }
    } catch {
      // keep default "en"
    }

    // `info` + `info.connection` are declared in io-package.json instanceObjects,
    // so the adapter framework creates them on install. Just set the initial state.
    await this.setStateAsync("info.connection", { val: false, ack: true });

    // Validate required config
    if (!config.url || !config.username || !config.password) {
      this.log.error(tLog(this.systemLang, "configIncomplete"));
      return;
    }

    this.client = new BeszelClient(config.url, config.username, config.password);
    this.stateManager = new StateManager(this, this.systemLang);

    // Migrate legacy flat state paths from pre-0.3.0
    await this.stateManager.migrateLegacyStates();

    // Cleanup disabled metric states for existing systems (config may have changed)
    for (const name of await this.stateManager.getExistingSystemNames()) {
      await this.stateManager.cleanupMetrics(name, config);
    }

    // Initial poll
    await this.poll();

    // Set up recurring poll
    const intervalMs = Math.max(10, config.pollInterval ?? 60) * 1000;
    this.pollTimer = this.setInterval(() => {
      void this.poll();
    }, intervalMs);

    this.log.info(
      tLog(this.systemLang, "adapterStarted", {
        count: this.lastSystemCount,
        seconds: config.pollInterval ?? 60,
      }),
    );
  }

  private onUnload(callback: () => void): void {
    try {
      if (this.pollTimer) {
        this.clearInterval(this.pollTimer);
        this.pollTimer = undefined;
      }
      if (this.unhandledRejectionHandler) {
        process.off("unhandledRejection", this.unhandledRejectionHandler);
        this.unhandledRejectionHandler = null;
      }
      if (this.uncaughtExceptionHandler) {
        process.off("uncaughtException", this.uncaughtExceptionHandler);
        this.uncaughtExceptionHandler = null;
      }
      void this.setState("info.connection", { val: false, ack: true });
    } catch {
      // ignore
    }
    callback();
  }

  private async onMessage(obj: ioBroker.Message): Promise<void> {
    if (!obj.callback) {
      return;
    }
    try {
      if (obj.command === "checkConnection") {
        const config = obj.message as Partial<AdapterConfig>;
        const url = config.url ?? "";
        const username = config.username ?? "";
        const password = config.password ?? "";

        if (!url || !username || !password) {
          this.sendTo(
            obj.from,
            obj.command,
            {
              success: false,
              message: "URL, username and password are required",
            },
            obj.callback,
          );
          return;
        }

        const testClient = new BeszelClient(url, username, password);
        const result = await testClient.checkConnection();
        this.sendTo(obj.from, obj.command, result, obj.callback);
      }
    } catch (err) {
      this.sendTo(obj.from, obj.command, { success: false, message: errText(err) }, obj.callback);
    }
  }

  /**
   * Classify an error for deduplication and log-level decisions.
   *
   * @param err The error to classify
   */
  private classifyError(err: unknown): string {
    if (!(err instanceof Error)) {
      return "UNKNOWN";
    }
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "UNAUTHORIZED") {
      return "UNAUTHORIZED";
    }
    if (
      code === "ENOTFOUND" ||
      code === "ECONNREFUSED" ||
      code === "ECONNRESET" ||
      code === "ENETUNREACH" ||
      code === "EHOSTUNREACH" ||
      code === "EAI_AGAIN"
    ) {
      return "NETWORK";
    }
    if (code === "ETIMEDOUT" || err.message.includes("timed out")) {
      return "TIMEOUT";
    }
    return code || "UNKNOWN";
  }

  private async poll(): Promise<void> {
    if (this.isPolling) {
      this.log.debug("Skipping poll — previous poll still running");
      return;
    }
    if (!this.client || !this.stateManager) {
      return;
    }

    this.isPolling = true;
    try {
      const config = this.config as unknown as AdapterConfig;

      // Fetch all data
      const [systems, containers] = await Promise.all([
        this.client.getSystems(),
        config.metrics_containers ? this.client.getContainers() : Promise.resolve([]),
      ]);

      const systemIds = systems.map(s => s.id);
      const statsMap = await this.client.getLatestStats(systemIds);

      // Update connection state
      await this.setStateAsync("info.connection", { val: true, ack: true });

      // Update each system (isolated: one failure must not block others)
      for (const system of systems) {
        try {
          const stats = statsMap.get(system.id);
          await this.stateManager.updateSystem(system, stats, containers, config);
          this.failedSystems.delete(system.name);
        } catch (err) {
          const msg = tLog(this.systemLang, "systemUpdateFailed", {
            name: system.name,
            error: errText(err),
          });
          if (this.failedSystems.has(system.name)) {
            this.log.debug(msg);
          } else {
            this.log.warn(msg);
            this.failedSystems.add(system.name);
          }
        }
      }

      // Cleanup stale systems — but only if we actually got results.
      // An empty list during a transient API issue must NOT wipe all devices.
      if (systems.length > 0 || this.lastSystemCount === 0) {
        await this.stateManager.cleanupSystems(systems.map(s => s.name));
      }

      this.lastSystemCount = systems.length;
      this.authFailCount = 0;

      // Clear error state on success
      if (this.lastErrorCode) {
        this.log.info(tLog(this.systemLang, "connectionRestored"));
        this.lastErrorCode = "";
      }
      this.log.debug(`Polled ${systems.length} systems successfully`);
    } catch (err) {
      const errMsg = errText(err);
      const errorCode = this.classifyError(err);
      const isRepeat = errorCode === this.lastErrorCode;
      this.lastErrorCode = errorCode;

      if (errorCode === "UNAUTHORIZED") {
        this.client?.invalidateToken();
        this.authFailCount++;
        if (this.authFailCount <= 3) {
          this.log.error(tLog(this.systemLang, "authFailed"));
        } else if (this.authFailCount === 4) {
          this.log.error(tLog(this.systemLang, "authSuppressed"));
        } else {
          this.log.debug(`Auth still failing (attempt ${this.authFailCount})`);
        }
      } else if (isRepeat) {
        this.log.debug(`Poll failed (ongoing): ${errMsg}`);
      } else if (errorCode === "NETWORK") {
        this.log.warn(tLog(this.systemLang, "cannotReach"));
      } else {
        this.log.error(tLog(this.systemLang, "pollFailed", { error: errMsg }));
      }

      await this.setStateAsync("info.connection", { val: false, ack: true });
    } finally {
      this.isPolling = false;
    }
  }
}

if (require.main !== module) {
  // Export the constructor in compact mode
  module.exports = (options: Partial<utils.AdapterOptions> | undefined) => new BeszelAdapter(options);
} else {
  (() => new BeszelAdapter())();
}

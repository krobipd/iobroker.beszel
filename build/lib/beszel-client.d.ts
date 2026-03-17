import type { BeszelContainer, BeszelSystem, SystemStats } from "./types.js";
/**
 * HTTP client for the Beszel PocketBase REST API.
 * Uses only Node.js built-in http/https — no extra dependencies.
 */
export declare class BeszelClient {
    private readonly baseUrl;
    private readonly username;
    private readonly password;
    private token;
    private tokenTime;
    /**
     * @param url Beszel Hub base URL, e.g. http://192.168.1.100:8090
     * @param username Login username
     * @param password Login password
     */
    constructor(url: string, username: string, password: string);
    /** Force token re-authentication on the next request */
    invalidateToken(): void;
    /**
     * Test the connection to Beszel.
     * Returns { success: true } or { success: false, message: reason }.
     */
    checkConnection(): Promise<{
        success: boolean;
        message: string;
    }>;
    /** Fetch all systems */
    getSystems(): Promise<BeszelSystem[]>;
    /**
     * Fetch the latest 1m stats per system.
     * Returns a Map<systemId, SystemStats>.
     *
     * @param systemIds List of system IDs to fetch stats for
     */
    getLatestStats(systemIds: string[]): Promise<Map<string, SystemStats>>;
    /** Fetch all containers */
    getContainers(): Promise<BeszelContainer[]>;
    private ensureToken;
    private authenticate;
    private fetchJson;
    private request;
}
//# sourceMappingURL=beszel-client.d.ts.map
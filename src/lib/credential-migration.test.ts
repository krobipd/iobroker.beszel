import { expect } from "chai";
import {
    type CredentialMigrationAdapter,
    looksLikePlaintextUsername,
    migrateUsernameEncryption,
} from "./credential-migration";

describe("credential-migration", () => {
    describe("looksLikePlaintextUsername", () => {
        it("treats email-shaped values as plaintext", () => {
            expect(looksLikePlaintextUsername("admin@example.com")).to.equal(true);
            expect(looksLikePlaintextUsername("user.name@beszel-hub.local")).to.equal(true);
        });

        it("treats strings containing whitespace as plaintext", () => {
            expect(looksLikePlaintextUsername("user with space")).to.equal(true);
            expect(looksLikePlaintextUsername("trailing ")).to.equal(true);
        });

        it("treats strings with non-hex characters as plaintext", () => {
            expect(looksLikePlaintextUsername("krobi_user")).to.equal(true);
            expect(looksLikePlaintextUsername("MyPassword!")).to.equal(true);
            expect(looksLikePlaintextUsername("hello-world")).to.equal(true);
        });

        it("treats odd-length hex strings ≥ 8 chars as plaintext", () => {
            // < 8 chars: heuristik unsicher, KEINE Migration (siehe Source-Kommentar)
            expect(looksLikePlaintextUsername("0123456789abcde")).to.equal(true);
            expect(looksLikePlaintextUsername("aabbccddeefff")).to.equal(true);
        });

        it("treats even-length pure-hex strings ≥ 8 chars as encrypted (no migration)", () => {
            expect(looksLikePlaintextUsername("0123456789abcdef")).to.equal(false);
            expect(looksLikePlaintextUsername("aabbccddeeff0011")).to.equal(false);
        });

        it("returns false for empty / non-string / very-short", () => {
            expect(looksLikePlaintextUsername("")).to.equal(false);
            expect(looksLikePlaintextUsername(null)).to.equal(false);
            expect(looksLikePlaintextUsername(undefined)).to.equal(false);
            expect(looksLikePlaintextUsername(42)).to.equal(false);
            // < 8 chars: heuristik unsicher → keine Migration
            expect(looksLikePlaintextUsername("abc123")).to.equal(false);
            expect(looksLikePlaintextUsername("a")).to.equal(false);
        });
    });

    describe("migrateUsernameEncryption", () => {
        interface Harness {
            adapter: CredentialMigrationAdapter;
            logs: { level: string; msg: string }[];
            encryptCalls: string[];
            extendCalls: { id: string; patch: Partial<ioBroker.Object> }[];
            getResult: ioBroker.Object | null;
        }

        function makeHarness(
            storedUsername: string | null,
            opts: { encryptImpl?: (v: string) => string; getThrows?: boolean; extendThrows?: boolean } = {},
        ): Harness {
            const logs: Harness["logs"] = [];
            const encryptCalls: string[] = [];
            const extendCalls: Harness["extendCalls"] = [];
            const getResult: ioBroker.Object | null =
                storedUsername === null
                    ? null
                    : ({ native: { username: storedUsername }, common: {} } as unknown as ioBroker.Object);
            const cfg: { username?: unknown } = { username: storedUsername ?? "" };
            const adapter: CredentialMigrationAdapter = {
                namespace: "beszel.0",
                config: cfg,
                log: {
                    debug: msg => logs.push({ level: "debug", msg }),
                    info: msg => logs.push({ level: "info", msg }),
                    warn: msg => logs.push({ level: "warn", msg }),
                },
                encrypt: v => {
                    encryptCalls.push(v);
                    if (opts.encryptImpl) {
                        return opts.encryptImpl(v);
                    }
                    return `ENC[${v}]`;
                },
                getForeignObjectAsync: async _id => {
                    if (opts.getThrows) {
                        throw new Error("broker down");
                    }
                    return getResult;
                },
                extendForeignObjectAsync: async (id, patch) => {
                    if (opts.extendThrows) {
                        throw new Error("write failed");
                    }
                    extendCalls.push({ id, patch });
                    return {};
                },
            };
            return { adapter, logs, encryptCalls, extendCalls, getResult };
        }

        it("migrates an email-shaped plaintext username", async () => {
            const h = makeHarness("admin@example.com");
            await migrateUsernameEncryption(h.adapter);

            expect(h.encryptCalls).to.deep.equal(["admin@example.com"]);
            expect(h.extendCalls).to.have.lengthOf(1);
            expect(h.extendCalls[0].id).to.equal("system.adapter.beszel.0");
            expect(h.extendCalls[0].patch).to.deep.equal({
                native: { username: "ENC[admin@example.com]" },
            });
            expect((h.adapter.config as { username?: unknown }).username).to.equal("admin@example.com");
            expect(h.logs.some(l => l.level === "info" && l.msg.includes("migrated"))).to.equal(true);
        });

        it("no-ops on already-encrypted-looking values", async () => {
            const h = makeHarness("0123456789abcdef0123456789abcdef");
            await migrateUsernameEncryption(h.adapter);

            expect(h.encryptCalls).to.have.lengthOf(0);
            expect(h.extendCalls).to.have.lengthOf(0);
            expect((h.adapter.config as { username?: unknown }).username).to.equal("0123456789abcdef0123456789abcdef");
        });

        it("no-ops on empty username", async () => {
            const h = makeHarness("");
            await migrateUsernameEncryption(h.adapter);
            expect(h.encryptCalls).to.have.lengthOf(0);
            expect(h.extendCalls).to.have.lengthOf(0);
        });

        it("no-ops when getForeignObject throws", async () => {
            const h = makeHarness("admin@example.com", { getThrows: true });
            await migrateUsernameEncryption(h.adapter);
            expect(h.encryptCalls).to.have.lengthOf(0);
            expect(h.extendCalls).to.have.lengthOf(0);
            expect(h.logs.some(l => l.level === "debug" && l.msg.includes("getForeignObject failed"))).to.equal(true);
        });

        it("warns + skips when encrypt() throws", async () => {
            const h = makeHarness("admin@example.com", {
                encryptImpl: () => {
                    throw new Error("no secret");
                },
            });
            await migrateUsernameEncryption(h.adapter);
            expect(h.extendCalls).to.have.lengthOf(0);
            expect(h.logs.some(l => l.level === "warn" && l.msg.includes("encrypt() threw"))).to.equal(true);
        });

        it("warns + skips when encrypt() returns the same value", async () => {
            const h = makeHarness("admin@example.com", {
                encryptImpl: v => v,
            });
            await migrateUsernameEncryption(h.adapter);
            expect(h.extendCalls).to.have.lengthOf(0);
            expect(h.logs.some(l => l.level === "warn" && l.msg.includes("unusable value"))).to.equal(true);
        });

        it("warns + skips when extendForeignObject throws", async () => {
            const h = makeHarness("admin@example.com", { extendThrows: true });
            await migrateUsernameEncryption(h.adapter);
            // encrypt was called (mutation attempted)
            expect(h.encryptCalls).to.have.lengthOf(1);
            // but config.username not flipped to plaintext (in-memory mutation skipped on storage-fail)
            expect(h.logs.some(l => l.level === "warn" && l.msg.includes("extendForeignObject failed"))).to.equal(true);
        });
    });
});

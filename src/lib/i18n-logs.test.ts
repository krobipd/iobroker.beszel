import { expect } from "chai";
import { LOG_STRINGS, tLog } from "./i18n-logs";

const SUPPORTED_LANGS = [
    "en",
    "de",
    "ru",
    "pt",
    "nl",
    "fr",
    "it",
    "es",
    "pl",
    "uk",
    "zh-cn",
] as const;

describe("i18n-logs", () => {
    describe("tLog", () => {
        it("returns the EN template when lang is 'en'", () => {
            expect(tLog("en", "connectionRestored")).to.equal(
                "Connection restored",
            );
        });

        it("returns the DE template when lang is 'de'", () => {
            expect(tLog("de", "connectionRestored")).to.equal(
                "Verbindung wiederhergestellt",
            );
        });

        it("falls back to EN for unknown language codes", () => {
            expect(tLog("klingon", "connectionRestored")).to.equal(
                "Connection restored",
            );
        });

        it("substitutes {key} tokens from params", () => {
            expect(
                tLog("en", "systemUpdateFailed", {
                    name: "srv01",
                    error: "ETIMEDOUT",
                }),
            ).to.equal("Failed to update system 'srv01': ETIMEDOUT");
        });

        it("renders null params as '(none)'", () => {
            expect(tLog("en", "systemSkipped", { name: null })).to.equal(
                "Skipping system with unusable name: (none)",
            );
        });

        it("keeps the literal {key} when a param is undefined", () => {
            expect(tLog("en", "pollFailed", {})).to.equal(
                "Poll failed: {error}",
            );
        });

        it("returns the template unchanged when no params are passed", () => {
            expect(tLog("en", "authFailed")).to.equal(
                "Authentication failed — check username and password",
            );
        });

        it("covers every key in all 11 supported languages", () => {
            for (const key of Object.keys(LOG_STRINGS) as Array<
                keyof typeof LOG_STRINGS
            >) {
                const bundle = LOG_STRINGS[key];
                for (const lang of SUPPORTED_LANGS) {
                    expect(
                        bundle[lang],
                        `missing ${lang} translation for ${key}`,
                    ).to.be.a("string").and.not.empty;
                }
            }
        });
    });
});

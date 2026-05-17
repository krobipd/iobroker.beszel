/**
 * v0.5.0 (B4): Auto-Migration für `native.username` von Klartext zu encrypted.
 *
 * Hintergrund: v0.4.x hatte `encryptedNative: ["password"]` — username lag im
 * Klartext im Object-DB. v0.5.0 erweitert auf `["username", "password"]`. Bei
 * bestehenden Instanzen sieht der Adapter-Framework-Auto-Decrypt jetzt einen
 * Klartext-Wert, versucht ihn zu entschlüsseln und produziert Müll-
 * Credentials → Login fehlt bis User in Admin geht und neu speichert.
 *
 * Diese Migration läuft einmalig pro Instanz in `onReady` BEVOR der
 * BeszelClient konstruiert wird:
 *
 * 1. Raw-Object via `getForeignObjectAsync` lesen
 * 2. Heuristik: sieht `native.username` nach Klartext aus?
 * 3. Falls ja: mit `adapter.encrypt()` chiffrieren, via
 *    `extendForeignObjectAsync` zurückschreiben, `this.config.username`
 *    in-memory auf den Klartext setzen damit der aktuelle Run funktioniert
 * 4. Beim nächsten Adapter-Start ist der Wert encrypted und das normale
 *    Auto-Decrypt greift wieder
 */

import { errText } from "./coerce";

/**
 * Minimaler Adapter-Shape den die Migration braucht — als Interface, damit
 * die Funktion ohne adapter-framework-Instanz unit-testbar bleibt.
 *
 * `config` ist `unknown` damit die Funktion sowohl mit BeszelAdapter (config
 * vom Typ `AdapterConfig`) als auch mit Test-Harness-Objects funktioniert.
 * Innerhalb der Funktion wird auf `username` getypt zugegriffen.
 */
export interface CredentialMigrationAdapter {
  /** Adapter-Instanz-Namespace, z.B. `beszel.0`. */
  namespace: string;
  /** `adapter.config` — Typ `unknown` damit Test-Harness flexibel zuweisen kann. */
  config: unknown;
  /** Adapter-Logger (debug/info/warn). */
  log: {
    /** debug-Level Log */
    debug: (msg: string) => void;
    /** info-Level Log */
    info: (msg: string) => void;
    /** warn-Level Log */
    warn: (msg: string) => void;
  };
  /** `adapter.encrypt()` — verschlüsselt mit `system.config.secret`. */
  encrypt: (value: string) => string;
  /** `adapter.getForeignObjectAsync` für das Adapter-Settings-Object. */
  getForeignObjectAsync: (id: string) => Promise<ioBroker.Object | null | undefined>;
  /** `adapter.extendForeignObjectAsync` für die Re-Encrypt-Persistenz. */
  extendForeignObjectAsync: (id: string, obj: Partial<ioBroker.Object>) => Promise<unknown>;
}

/**
 * Heuristik: sieht der String nach Klartext aus, nicht nach unserem
 * ioBroker-Ciphertext?
 *
 * ioBroker encrypt() liefert für AES-192-CBC seit js-controller 7 typischerweise
 * eine reine hex-Folge gerader Länge. Klartext-Indikatoren:
 * - enthält `@` (E-Mail-typisch für Beszel Hub Admin-User)
 * - enthält Whitespace
 * - enthält Nicht-Hex-Zeichen
 * - ungerade Länge (Hex muss gerade sein)
 *
 * Sehr kurze Strings (< 8 Zeichen) lassen wir liegen — könnte beides sein,
 * sicherer keine Migration als falsche Migration.
 *
 * @param value Der gespeicherte Wert aus native.username
 */
export function looksLikePlaintextUsername(value: unknown): boolean {
  if (typeof value !== "string" || value.length === 0) {
    return false;
  }
  if (value.length < 8) {
    // zu kurz für eine eindeutige Heuristik — Annahme: könnte Test-User sein, KEINE Migration
    return false;
  }
  if (value.includes("@")) {
    return true;
  }
  if (/\s/.test(value)) {
    return true;
  }
  if (!/^[0-9a-fA-F]+$/.test(value)) {
    return true;
  }
  if (value.length % 2 !== 0) {
    return true;
  }
  return false;
}

/**
 * Falls `native.username` als Klartext erkannt wird: verschlüsseln, in Object-DB
 * schreiben, `adapter.config.username` für diesen Run mit dem Klartext überschreiben.
 *
 * Schweigt bei bereits-verschlüsselten Werten, leeren Werten oder fehlendem
 * Object. Loggt info bei erfolgreicher Migration, warn bei encrypt-Throw.
 *
 * @param adapter Adapter-Shape mit Logger, encrypt, foreign-object-Async-API.
 */
export async function migrateUsernameEncryption(adapter: CredentialMigrationAdapter): Promise<void> {
  const fullId = `system.adapter.${adapter.namespace}`;
  let obj: ioBroker.Object | null | undefined;
  try {
    obj = await adapter.getForeignObjectAsync(fullId);
  } catch (err) {
    adapter.log.debug(`migrateUsernameEncryption: getForeignObject failed: ${errText(err)}`);
    return;
  }
  const stored = obj?.native?.username;
  if (typeof stored !== "string" || stored.length === 0) {
    return;
  }
  if (!looksLikePlaintextUsername(stored)) {
    adapter.log.debug("migrateUsernameEncryption: username already encrypted (or unrecognised shape), skipping");
    return;
  }

  let encrypted: string;
  try {
    encrypted = adapter.encrypt(stored);
  } catch (err) {
    adapter.log.warn(`migrateUsernameEncryption: encrypt() threw, skipping migration: ${errText(err)}`);
    return;
  }
  if (typeof encrypted !== "string" || encrypted.length === 0 || encrypted === stored) {
    adapter.log.warn("migrateUsernameEncryption: encrypt() returned unusable value, skipping");
    return;
  }

  try {
    await adapter.extendForeignObjectAsync(fullId, { native: { username: encrypted } });
  } catch (err) {
    adapter.log.warn(`migrateUsernameEncryption: extendForeignObject failed: ${errText(err)}`);
    return;
  }

  // In-memory: this run sollte mit dem echten Klartext weiter laufen.
  // Beim nächsten Adapter-Start liest der Framework-Auto-Decrypt den
  // jetzt-encrypted Wert korrekt.
  (adapter.config as { username?: unknown }).username = stored;
  adapter.log.info("Username storage migrated to encrypted (1-time, v0.5.0)");
}

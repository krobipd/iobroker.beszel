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
  /** Adapter-Logger (debug/info/warn/error). */
  log: {
    /** debug-Level Log */
    debug: (msg: string) => void;
    /** info-Level Log */
    info: (msg: string) => void;
    /** warn-Level Log */
    warn: (msg: string) => void;
    /** error-Level Log */
    error: (msg: string) => void;
  };
  /** `adapter.encrypt()` — verschlüsselt mit `system.config.secret`. */
  encrypt: (value: string) => string;
  /** `adapter.getForeignObjectAsync` für das Adapter-Settings-Object. */
  getForeignObjectAsync: (id: string) => Promise<ioBroker.Object | null | undefined>;
  /** `adapter.extendForeignObjectAsync` für die Re-Encrypt-Persistenz. */
  extendForeignObjectAsync: (id: string, obj: Partial<ioBroker.Object>) => Promise<unknown>;
}

/**
 * ioBroker js-controller 7 verschlüsselt encryptedNative-Felder mit dem Format
 * `$/aes-192-cbc:<iv-hex>:<ciphertext-hex>`. Dieses Prefix ist der eindeutige
 * Marker dass der gespeicherte Wert bereits encrypted ist — egal wie lang er ist
 * oder welche Zeichen drin sind. Reference: `reference_iobroker_encrypted_credentials`.
 */
const IOBROKER_ENCRYPTED_PREFIX = "$/aes-192-cbc:";

/**
 * Heuristik: sieht der RAW DB-Wert nach Klartext aus?
 *
 * Logik:
 * 1. Beginnt der Wert mit `$/aes-192-cbc:` → bereits encrypted, KEINE Migration.
 * 2. Sehr kurz (< 8 Zeichen) → unklar, sicherer KEINE Migration.
 * 3. Sonst: alles was Klartext-Indikatoren hat (`@`, Whitespace, Nicht-Hex,
 *    ungerade Länge) → migrate.
 *
 * @param value Der gespeicherte Wert aus native.username (raw, via
 *   `getForeignObjectAsync` — KEIN framework-decrypt).
 */
export function looksLikePlaintextUsername(value: unknown): boolean {
  if (typeof value !== "string" || value.length === 0) {
    return false;
  }
  if (value.startsWith(IOBROKER_ENCRYPTED_PREFIX)) {
    // Schon im offiziellen js-controller-Format → niemals re-encrypten.
    return false;
  }
  if (value.length < 8) {
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
 * Erkennt v0.5.0/v0.5.1-Korruptionszustand: wenn `this.config.username` (vom
 * Framework auto-decrypted) immer noch mit dem encrypted-Prefix beginnt, hat
 * der Framework-Decrypt einen mehrfach-verschlüsselten Wert nur eine Schicht
 * abgeschält. Der Wert ist nicht Klartext, Auth wird fehlschlagen. Wir
 * räumen die DB auf und bitten den User um Re-Save.
 *
 * @param decryptedValue `adapter.config.username` (nach Framework-Auto-Decrypt).
 */
export function looksLikeCorruptedNestedEncryption(decryptedValue: unknown): boolean {
  return typeof decryptedValue === "string" && decryptedValue.startsWith(IOBROKER_ENCRYPTED_PREFIX);
}

/**
 * Falls `native.username` als Klartext erkannt wird: verschlüsseln, in Object-DB
 * schreiben, `adapter.config.username` für diesen Run mit dem Klartext überschreiben.
 *
 * Zusätzlich (seit v0.5.2): wenn `adapter.config.username` (vom Framework
 * auto-decrypted) noch das `$/aes-192-cbc:`-Prefix trägt, ist der DB-Wert
 * mehrfach verschachtelt encrypted (v0.5.0/v0.5.1-Migration-Loop). Wir
 * räumen `native.username` auf leeren String und loggen einen klaren Fehler.
 *
 * Schweigt bei bereits-verschlüsselten Werten, leeren Werten oder fehlendem
 * Object. Loggt info bei erfolgreicher Migration, warn bei encrypt-Throw,
 * error bei Korruption.
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

  // v0.5.2 Recovery: Korruptionszustand aus v0.5.0/v0.5.1-Migration-Loop
  // erkennen. Wenn this.config.username NACH Framework-Auto-Decrypt immer
  // noch mit dem encrypted-Prefix beginnt, hat der Framework nur EINE
  // Schicht abgeschält — der DB-Wert ist N-mal nested encrypted.
  const decryptedValue = (adapter.config as { username?: unknown }).username;
  if (looksLikeCorruptedNestedEncryption(decryptedValue)) {
    try {
      await adapter.extendForeignObjectAsync(fullId, { native: { username: "" } });
    } catch (err) {
      adapter.log.warn(`migrateUsernameEncryption: extendForeignObject (clear) failed: ${errText(err)}`);
      return;
    }
    adapter.log.error(
      "Beszel username storage is corrupted from the v0.5.0/v0.5.1 migration loop bug. " +
        "It has been cleared. Please open the Beszel adapter settings in ioBroker Admin, " +
        "re-enter your username and password, and save. Sorry for the inconvenience.",
    );
    (adapter.config as { username?: unknown }).username = "";
    return;
  }

  if (!looksLikePlaintextUsername(stored)) {
    adapter.log.debug("migrateUsernameEncryption: username already encrypted ($/aes-192-cbc:…), skipping");
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

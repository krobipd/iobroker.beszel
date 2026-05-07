/**
 * Localized log strings — info/warn/error end up in the ioBroker admin log,
 * which is user-facing. Translations cover all 11 ioBroker system languages
 * (en/de/ru/pt/nl/fr/it/es/pl/uk/zh-cn).
 *
 * The active language is read once in `main.onReady` from
 * `system.config.language` and stored on the adapter instance. A language
 * change in admin requires an adapter restart — acceptable, users don't
 * switch languages on the fly.
 *
 * Debug logs stay English (maintainer diagnostics, not user-visible at
 * default loglevel).
 */

const SUPPORTED_LANGS = ["en", "de", "ru", "pt", "nl", "fr", "it", "es", "pl", "uk", "zh-cn"] as const;
type Lang = (typeof SUPPORTED_LANGS)[number];

/**
 * Token substitution: `{name}` in the template is replaced with `params.name`.
 * `null` values render as `(none)`, missing tokens are kept as `{key}` so a
 * caller bug surfaces in the log instead of silently emitting an empty string.
 *
 * @param template Localized log string with `{key}` placeholders.
 * @param params   Token values; `null` → `(none)`, `undefined` → token kept.
 */
function fmt(template: string, params?: Record<string, string | number | null | undefined>): string {
  if (!params) {
    return template;
  }
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const v = params[key];
    if (v === null) {
      return "(none)";
    }
    if (v === undefined) {
      return `{${key}}`;
    }
    return String(v);
  });
}

/**
 * All user-facing info/warn/error strings. Keys are descriptive identifiers,
 * values are bundles for the 11 supported ioBroker system languages.
 */
export const LOG_STRINGS = {
  // ──────── Adapter lifecycle / crash defense ────────
  onReadyFailed: {
    en: "onReady failed: {error}",
    de: "onReady fehlgeschlagen: {error}",
    ru: "onReady завершился с ошибкой: {error}",
    pt: "onReady falhou: {error}",
    nl: "onReady is mislukt: {error}",
    fr: "onReady a échoué : {error}",
    it: "onReady non riuscito: {error}",
    es: "onReady falló: {error}",
    pl: "onReady nie powiódł się: {error}",
    uk: "onReady завершився з помилкою: {error}",
    "zh-cn": "onReady 失败：{error}",
  },
  onMessageFailed: {
    en: "onMessage failed: {error}",
    de: "onMessage fehlgeschlagen: {error}",
    ru: "onMessage завершился с ошибкой: {error}",
    pt: "onMessage falhou: {error}",
    nl: "onMessage is mislukt: {error}",
    fr: "onMessage a échoué : {error}",
    it: "onMessage non riuscito: {error}",
    es: "onMessage falló: {error}",
    pl: "onMessage nie powiódł się: {error}",
    uk: "onMessage завершився з помилкою: {error}",
    "zh-cn": "onMessage 失败：{error}",
  },
  unhandledRejection: {
    en: "Unhandled rejection: {error}",
    de: "Unbehandelte Promise-Rejection: {error}",
    ru: "Необработанный rejection: {error}",
    pt: "Rejeição não tratada: {error}",
    nl: "Onafgehandelde rejection: {error}",
    fr: "Rejet non géré : {error}",
    it: "Rejection non gestita: {error}",
    es: "Rechazo no manejado: {error}",
    pl: "Nieobsłużone odrzucenie: {error}",
    uk: "Необроблений rejection: {error}",
    "zh-cn": "未处理的 rejection：{error}",
  },
  uncaughtException: {
    en: "Uncaught exception: {error}",
    de: "Nicht abgefangene Exception: {error}",
    ru: "Необработанное исключение: {error}",
    pt: "Exceção não capturada: {error}",
    nl: "Niet-opgevangen exception: {error}",
    fr: "Exception non capturée : {error}",
    it: "Eccezione non catturata: {error}",
    es: "Excepción no capturada: {error}",
    pl: "Nieprzechwycony wyjątek: {error}",
    uk: "Неперехоплене виключення: {error}",
    "zh-cn": "未捕获的异常：{error}",
  },

  // ──────── Configuration / startup ────────
  configIncomplete: {
    en: "URL, username, and password are required — please configure the adapter settings",
    de: "URL, Benutzername und Passwort sind erforderlich — bitte trage die Adapter-Einstellungen ein",
    ru: "Требуются URL, имя пользователя и пароль — заполните настройки адаптера",
    pt: "URL, utilizador e palavra-passe são obrigatórios — configure as definições do adaptador",
    nl: "URL, gebruikersnaam en wachtwoord zijn vereist — vul de adapter-instellingen in",
    fr: "URL, nom d'utilisateur et mot de passe sont requis — configurez les paramètres de l'adaptateur",
    it: "URL, nome utente e password sono obbligatori — configura le impostazioni dell'adattatore",
    es: "URL, usuario y contraseña son obligatorios — configura los ajustes del adaptador",
    pl: "URL, nazwa użytkownika i hasło są wymagane — skonfiguruj ustawienia adaptera",
    uk: "URL, ім'я користувача та пароль потрібні — заповніть налаштування адаптера",
    "zh-cn": "需要 URL、用户名和密码 — 请配置适配器设置",
  },
  adapterStarted: {
    en: "Beszel adapter started — {count} system(s), polling every {seconds}s",
    de: "Beszel-Adapter gestartet — {count} System(e), Abfrage alle {seconds}s",
    ru: "Beszel-адаптер запущен — {count} систем(ы), опрос каждые {seconds}с",
    pt: "Adaptador Beszel iniciado — {count} sistema(s), sondagem a cada {seconds}s",
    nl: "Beszel-adapter gestart — {count} systeem(en), pollen elke {seconds}s",
    fr: "Adaptateur Beszel démarré — {count} système(s), interrogation toutes les {seconds}s",
    it: "Adattatore Beszel avviato — {count} sistema/i, interrogazione ogni {seconds}s",
    es: "Adaptador Beszel iniciado — {count} sistema(s), consulta cada {seconds}s",
    pl: "Adapter Beszel uruchomiony — {count} system(y), odpytywanie co {seconds}s",
    uk: "Beszel-адаптер запущено — {count} систем(и), опитування кожні {seconds}с",
    "zh-cn": "Beszel 适配器已启动 — {count} 个系统，每 {seconds} 秒轮询一次",
  },

  // ──────── Connection / poll ────────
  connectionRestored: {
    en: "Connection restored",
    de: "Verbindung wiederhergestellt",
    ru: "Соединение восстановлено",
    pt: "Conexão restabelecida",
    nl: "Verbinding hersteld",
    fr: "Connexion rétablie",
    it: "Connessione ripristinata",
    es: "Conexión restablecida",
    pl: "Połączenie przywrócone",
    uk: "З'єднання відновлено",
    "zh-cn": "连接已恢复",
  },
  cannotReach: {
    en: "Cannot reach Beszel Hub — will keep retrying",
    de: "Beszel-Hub nicht erreichbar — Versuche werden fortgesetzt",
    ru: "Beszel Hub недоступен — попытки продолжаются",
    pt: "Não foi possível contactar o Beszel Hub — tentativas continuarão",
    nl: "Beszel Hub onbereikbaar — pogingen worden voortgezet",
    fr: "Beszel Hub injoignable — les tentatives continuent",
    it: "Beszel Hub non raggiungibile — i tentativi continueranno",
    es: "Beszel Hub inaccesible — se seguirán intentando",
    pl: "Beszel Hub niedostępny — próby będą kontynuowane",
    uk: "Beszel Hub недоступний — спроби триватимуть",
    "zh-cn": "无法访问 Beszel Hub — 将继续重试",
  },
  pollFailed: {
    en: "Poll failed: {error}",
    de: "Abfrage fehlgeschlagen: {error}",
    ru: "Опрос завершился с ошибкой: {error}",
    pt: "Sondagem falhou: {error}",
    nl: "Poll is mislukt: {error}",
    fr: "Échec de l'interrogation : {error}",
    it: "Interrogazione non riuscita: {error}",
    es: "Consulta falló: {error}",
    pl: "Odpytywanie nie powiodło się: {error}",
    uk: "Опитування завершилось з помилкою: {error}",
    "zh-cn": "轮询失败：{error}",
  },

  // ──────── Auth ────────
  authFailed: {
    en: "Authentication failed — check username and password",
    de: "Authentifizierung fehlgeschlagen — Benutzername und Passwort prüfen",
    ru: "Ошибка аутентификации — проверьте имя пользователя и пароль",
    pt: "Autenticação falhou — verifique utilizador e palavra-passe",
    nl: "Aanmelding mislukt — controleer gebruikersnaam en wachtwoord",
    fr: "Échec de l'authentification — vérifiez nom d'utilisateur et mot de passe",
    it: "Autenticazione non riuscita — controlla nome utente e password",
    es: "Autenticación falló — comprueba usuario y contraseña",
    pl: "Uwierzytelnianie nie powiodło się — sprawdź nazwę użytkownika i hasło",
    uk: "Помилка автентифікації — перевірте ім'я користувача та пароль",
    "zh-cn": "身份验证失败 — 请检查用户名和密码",
  },
  authSuppressed: {
    en: "Authentication keeps failing — suppressing further auth errors",
    de: "Authentifizierung scheitert weiterhin — weitere Auth-Fehler werden unterdrückt",
    ru: "Аутентификация продолжает давать сбой — дальнейшие ошибки auth подавляются",
    pt: "Autenticação continua a falhar — futuros erros de auth serão suprimidos",
    nl: "Aanmelding blijft mislukken — verdere auth-fouten worden onderdrukt",
    fr: "L'authentification continue d'échouer — les erreurs auth suivantes seront masquées",
    it: "L'autenticazione continua a fallire — ulteriori errori di auth verranno soppressi",
    es: "La autenticación sigue fallando — se suprimirán los próximos errores de auth",
    pl: "Uwierzytelnianie ciągle zawodzi — dalsze błędy auth są pomijane",
    uk: "Автентифікація продовжує невдало — подальші auth-помилки придушуються",
    "zh-cn": "身份验证持续失败 — 后续 auth 错误将被抑制",
  },

  // ──────── Per-system update ────────
  systemUpdateFailed: {
    en: "Failed to update system '{name}': {error}",
    de: "Aktualisierung von System '{name}' fehlgeschlagen: {error}",
    ru: "Не удалось обновить систему '{name}': {error}",
    pt: "Falha ao atualizar sistema '{name}': {error}",
    nl: "Bijwerken van systeem '{name}' is mislukt: {error}",
    fr: "Échec de la mise à jour du système '{name}' : {error}",
    it: "Impossibile aggiornare il sistema '{name}': {error}",
    es: "Error al actualizar el sistema '{name}': {error}",
    pl: "Nie udało się zaktualizować systemu '{name}': {error}",
    uk: "Не вдалося оновити систему '{name}': {error}",
    "zh-cn": "无法更新系统 '{name}'：{error}",
  },
  systemSkipped: {
    en: "Skipping system with unusable name: {name}",
    de: "System mit unbrauchbarem Namen übersprungen: {name}",
    ru: "Пропущена система с непригодным именем: {name}",
    pt: "Sistema com nome inutilizável ignorado: {name}",
    nl: "Systeem met onbruikbare naam overgeslagen: {name}",
    fr: "Système avec nom inutilisable ignoré : {name}",
    it: "Sistema con nome inutilizzabile saltato: {name}",
    es: "Saltando sistema con nombre inutilizable: {name}",
    pl: "Pominięto system o niewłaściwej nazwie: {name}",
    uk: "Пропущено систему з непридатним іменем: {name}",
    "zh-cn": "跳过名称无效的系统：{name}",
  },

  // ──────── Migration ────────
  legacyMigrated: {
    en: "Migration: removed {count} legacy state(s) from flat structure",
    de: "Migration: {count} alte(r) Datenpunkt(e) aus flacher Struktur entfernt",
    ru: "Миграция: удалено {count} устаревших датчик(ов) из плоской структуры",
    pt: "Migração: removido(s) {count} datapoint(s) antigo(s) da estrutura plana",
    nl: "Migratie: {count} oude datapoint(s) uit platte structuur verwijderd",
    fr: "Migration : suppression de {count} ancien(s) datapoint(s) de la structure plate",
    it: "Migrazione: rimosso(i) {count} vecchio(i) datapoint dalla struttura piatta",
    es: "Migración: eliminado(s) {count} datapoint(s) antiguo(s) de la estructura plana",
    pl: "Migracja: usunięto {count} stary(ch) datapoint(ów) z płaskiej struktury",
    uk: "Міграція: видалено {count} застарілих датапоінт(ів) з плоскої структури",
    "zh-cn": "迁移：已从扁平结构中移除 {count} 个旧数据点",
  },
} as const;

/**
 * Look up a log string in the requested language with EN fallback.
 *
 * @param lang   ioBroker system language (`'en'`, `'de'`, …) — any string
 *               accepted, falls back to `en` for unknown values.
 * @param key    Translation key from {@link LOG_STRINGS}.
 * @param params Token values for `{name}` placeholders.
 */
export function tLog(
  lang: string,
  key: keyof typeof LOG_STRINGS,
  params?: Record<string, string | number | null | undefined>,
): string {
  const langKey = (SUPPORTED_LANGS as readonly string[]).includes(lang) ? (lang as Lang) : "en";
  const bundle = LOG_STRINGS[key];
  const template = bundle[langKey] ?? bundle.en;
  return fmt(template, params);
}

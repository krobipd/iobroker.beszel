"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var i18n_logs_exports = {};
__export(i18n_logs_exports, {
  LOG_STRINGS: () => LOG_STRINGS,
  tLog: () => tLog
});
module.exports = __toCommonJS(i18n_logs_exports);
const SUPPORTED_LANGS = ["en", "de", "ru", "pt", "nl", "fr", "it", "es", "pl", "uk", "zh-cn"];
function fmt(template, params) {
  if (!params) {
    return template;
  }
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const v = params[key];
    if (v === null) {
      return "(none)";
    }
    if (v === void 0) {
      return `{${key}}`;
    }
    return String(v);
  });
}
const LOG_STRINGS = {
  // ──────── Adapter lifecycle / crash defense ────────
  onReadyFailed: {
    en: "onReady failed: {error}",
    de: "onReady fehlgeschlagen: {error}",
    ru: "onReady \u0437\u0430\u0432\u0435\u0440\u0448\u0438\u043B\u0441\u044F \u0441 \u043E\u0448\u0438\u0431\u043A\u043E\u0439: {error}",
    pt: "onReady falhou: {error}",
    nl: "onReady is mislukt: {error}",
    fr: "onReady a \xE9chou\xE9 : {error}",
    it: "onReady non riuscito: {error}",
    es: "onReady fall\xF3: {error}",
    pl: "onReady nie powi\xF3d\u0142 si\u0119: {error}",
    uk: "onReady \u0437\u0430\u0432\u0435\u0440\u0448\u0438\u0432\u0441\u044F \u0437 \u043F\u043E\u043C\u0438\u043B\u043A\u043E\u044E: {error}",
    "zh-cn": "onReady \u5931\u8D25\uFF1A{error}"
  },
  onMessageFailed: {
    en: "onMessage failed: {error}",
    de: "onMessage fehlgeschlagen: {error}",
    ru: "onMessage \u0437\u0430\u0432\u0435\u0440\u0448\u0438\u043B\u0441\u044F \u0441 \u043E\u0448\u0438\u0431\u043A\u043E\u0439: {error}",
    pt: "onMessage falhou: {error}",
    nl: "onMessage is mislukt: {error}",
    fr: "onMessage a \xE9chou\xE9 : {error}",
    it: "onMessage non riuscito: {error}",
    es: "onMessage fall\xF3: {error}",
    pl: "onMessage nie powi\xF3d\u0142 si\u0119: {error}",
    uk: "onMessage \u0437\u0430\u0432\u0435\u0440\u0448\u0438\u0432\u0441\u044F \u0437 \u043F\u043E\u043C\u0438\u043B\u043A\u043E\u044E: {error}",
    "zh-cn": "onMessage \u5931\u8D25\uFF1A{error}"
  },
  unhandledRejection: {
    en: "Unhandled rejection: {error}",
    de: "Unbehandelte Promise-Rejection: {error}",
    ru: "\u041D\u0435\u043E\u0431\u0440\u0430\u0431\u043E\u0442\u0430\u043D\u043D\u044B\u0439 rejection: {error}",
    pt: "Rejei\xE7\xE3o n\xE3o tratada: {error}",
    nl: "Onafgehandelde rejection: {error}",
    fr: "Rejet non g\xE9r\xE9 : {error}",
    it: "Rejection non gestita: {error}",
    es: "Rechazo no manejado: {error}",
    pl: "Nieobs\u0142u\u017Cone odrzucenie: {error}",
    uk: "\u041D\u0435\u043E\u0431\u0440\u043E\u0431\u043B\u0435\u043D\u0438\u0439 rejection: {error}",
    "zh-cn": "\u672A\u5904\u7406\u7684 rejection\uFF1A{error}"
  },
  uncaughtException: {
    en: "Uncaught exception: {error}",
    de: "Nicht abgefangene Exception: {error}",
    ru: "\u041D\u0435\u043E\u0431\u0440\u0430\u0431\u043E\u0442\u0430\u043D\u043D\u043E\u0435 \u0438\u0441\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435: {error}",
    pt: "Exce\xE7\xE3o n\xE3o capturada: {error}",
    nl: "Niet-opgevangen exception: {error}",
    fr: "Exception non captur\xE9e : {error}",
    it: "Eccezione non catturata: {error}",
    es: "Excepci\xF3n no capturada: {error}",
    pl: "Nieprzechwycony wyj\u0105tek: {error}",
    uk: "\u041D\u0435\u043F\u0435\u0440\u0435\u0445\u043E\u043F\u043B\u0435\u043D\u0435 \u0432\u0438\u043A\u043B\u044E\u0447\u0435\u043D\u043D\u044F: {error}",
    "zh-cn": "\u672A\u6355\u83B7\u7684\u5F02\u5E38\uFF1A{error}"
  },
  // ──────── Configuration / startup ────────
  configIncomplete: {
    en: "URL, username, and password are required \u2014 please configure the adapter settings",
    de: "URL, Benutzername und Passwort sind erforderlich \u2014 bitte trage die Adapter-Einstellungen ein",
    ru: "\u0422\u0440\u0435\u0431\u0443\u044E\u0442\u0441\u044F URL, \u0438\u043C\u044F \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F \u0438 \u043F\u0430\u0440\u043E\u043B\u044C \u2014 \u0437\u0430\u043F\u043E\u043B\u043D\u0438\u0442\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u0430\u0434\u0430\u043F\u0442\u0435\u0440\u0430",
    pt: "URL, utilizador e palavra-passe s\xE3o obrigat\xF3rios \u2014 configure as defini\xE7\xF5es do adaptador",
    nl: "URL, gebruikersnaam en wachtwoord zijn vereist \u2014 vul de adapter-instellingen in",
    fr: "URL, nom d'utilisateur et mot de passe sont requis \u2014 configurez les param\xE8tres de l'adaptateur",
    it: "URL, nome utente e password sono obbligatori \u2014 configura le impostazioni dell'adattatore",
    es: "URL, usuario y contrase\xF1a son obligatorios \u2014 configura los ajustes del adaptador",
    pl: "URL, nazwa u\u017Cytkownika i has\u0142o s\u0105 wymagane \u2014 skonfiguruj ustawienia adaptera",
    uk: "URL, \u0456\u043C'\u044F \u043A\u043E\u0440\u0438\u0441\u0442\u0443\u0432\u0430\u0447\u0430 \u0442\u0430 \u043F\u0430\u0440\u043E\u043B\u044C \u043F\u043E\u0442\u0440\u0456\u0431\u043D\u0456 \u2014 \u0437\u0430\u043F\u043E\u0432\u043D\u0456\u0442\u044C \u043D\u0430\u043B\u0430\u0448\u0442\u0443\u0432\u0430\u043D\u043D\u044F \u0430\u0434\u0430\u043F\u0442\u0435\u0440\u0430",
    "zh-cn": "\u9700\u8981 URL\u3001\u7528\u6237\u540D\u548C\u5BC6\u7801 \u2014 \u8BF7\u914D\u7F6E\u9002\u914D\u5668\u8BBE\u7F6E"
  },
  adapterStarted: {
    en: "Beszel adapter started \u2014 {count} system(s), polling every {seconds}s",
    de: "Beszel-Adapter gestartet \u2014 {count} System(e), Abfrage alle {seconds}s",
    ru: "Beszel-\u0430\u0434\u0430\u043F\u0442\u0435\u0440 \u0437\u0430\u043F\u0443\u0449\u0435\u043D \u2014 {count} \u0441\u0438\u0441\u0442\u0435\u043C(\u044B), \u043E\u043F\u0440\u043E\u0441 \u043A\u0430\u0436\u0434\u044B\u0435 {seconds}\u0441",
    pt: "Adaptador Beszel iniciado \u2014 {count} sistema(s), sondagem a cada {seconds}s",
    nl: "Beszel-adapter gestart \u2014 {count} systeem(en), pollen elke {seconds}s",
    fr: "Adaptateur Beszel d\xE9marr\xE9 \u2014 {count} syst\xE8me(s), interrogation toutes les {seconds}s",
    it: "Adattatore Beszel avviato \u2014 {count} sistema/i, interrogazione ogni {seconds}s",
    es: "Adaptador Beszel iniciado \u2014 {count} sistema(s), consulta cada {seconds}s",
    pl: "Adapter Beszel uruchomiony \u2014 {count} system(y), odpytywanie co {seconds}s",
    uk: "Beszel-\u0430\u0434\u0430\u043F\u0442\u0435\u0440 \u0437\u0430\u043F\u0443\u0449\u0435\u043D\u043E \u2014 {count} \u0441\u0438\u0441\u0442\u0435\u043C(\u0438), \u043E\u043F\u0438\u0442\u0443\u0432\u0430\u043D\u043D\u044F \u043A\u043E\u0436\u043D\u0456 {seconds}\u0441",
    "zh-cn": "Beszel \u9002\u914D\u5668\u5DF2\u542F\u52A8 \u2014 {count} \u4E2A\u7CFB\u7EDF\uFF0C\u6BCF {seconds} \u79D2\u8F6E\u8BE2\u4E00\u6B21"
  },
  // ──────── Connection / poll ────────
  connectionRestored: {
    en: "Connection restored",
    de: "Verbindung wiederhergestellt",
    ru: "\u0421\u043E\u0435\u0434\u0438\u043D\u0435\u043D\u0438\u0435 \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043E",
    pt: "Conex\xE3o restabelecida",
    nl: "Verbinding hersteld",
    fr: "Connexion r\xE9tablie",
    it: "Connessione ripristinata",
    es: "Conexi\xF3n restablecida",
    pl: "Po\u0142\u0105czenie przywr\xF3cone",
    uk: "\u0417'\u0454\u0434\u043D\u0430\u043D\u043D\u044F \u0432\u0456\u0434\u043D\u043E\u0432\u043B\u0435\u043D\u043E",
    "zh-cn": "\u8FDE\u63A5\u5DF2\u6062\u590D"
  },
  cannotReach: {
    en: "Cannot reach Beszel Hub \u2014 will keep retrying",
    de: "Beszel-Hub nicht erreichbar \u2014 Versuche werden fortgesetzt",
    ru: "Beszel Hub \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D \u2014 \u043F\u043E\u043F\u044B\u0442\u043A\u0438 \u043F\u0440\u043E\u0434\u043E\u043B\u0436\u0430\u044E\u0442\u0441\u044F",
    pt: "N\xE3o foi poss\xEDvel contactar o Beszel Hub \u2014 tentativas continuar\xE3o",
    nl: "Beszel Hub onbereikbaar \u2014 pogingen worden voortgezet",
    fr: "Beszel Hub injoignable \u2014 les tentatives continuent",
    it: "Beszel Hub non raggiungibile \u2014 i tentativi continueranno",
    es: "Beszel Hub inaccesible \u2014 se seguir\xE1n intentando",
    pl: "Beszel Hub niedost\u0119pny \u2014 pr\xF3by b\u0119d\u0105 kontynuowane",
    uk: "Beszel Hub \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u0438\u0439 \u2014 \u0441\u043F\u0440\u043E\u0431\u0438 \u0442\u0440\u0438\u0432\u0430\u0442\u0438\u043C\u0443\u0442\u044C",
    "zh-cn": "\u65E0\u6CD5\u8BBF\u95EE Beszel Hub \u2014 \u5C06\u7EE7\u7EED\u91CD\u8BD5"
  },
  pollFailed: {
    en: "Poll failed: {error}",
    de: "Abfrage fehlgeschlagen: {error}",
    ru: "\u041E\u043F\u0440\u043E\u0441 \u0437\u0430\u0432\u0435\u0440\u0448\u0438\u043B\u0441\u044F \u0441 \u043E\u0448\u0438\u0431\u043A\u043E\u0439: {error}",
    pt: "Sondagem falhou: {error}",
    nl: "Poll is mislukt: {error}",
    fr: "\xC9chec de l'interrogation : {error}",
    it: "Interrogazione non riuscita: {error}",
    es: "Consulta fall\xF3: {error}",
    pl: "Odpytywanie nie powiod\u0142o si\u0119: {error}",
    uk: "\u041E\u043F\u0438\u0442\u0443\u0432\u0430\u043D\u043D\u044F \u0437\u0430\u0432\u0435\u0440\u0448\u0438\u043B\u043E\u0441\u044C \u0437 \u043F\u043E\u043C\u0438\u043B\u043A\u043E\u044E: {error}",
    "zh-cn": "\u8F6E\u8BE2\u5931\u8D25\uFF1A{error}"
  },
  // ──────── Auth ────────
  authFailed: {
    en: "Authentication failed \u2014 check username and password",
    de: "Authentifizierung fehlgeschlagen \u2014 Benutzername und Passwort pr\xFCfen",
    ru: "\u041E\u0448\u0438\u0431\u043A\u0430 \u0430\u0443\u0442\u0435\u043D\u0442\u0438\u0444\u0438\u043A\u0430\u0446\u0438\u0438 \u2014 \u043F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435 \u0438\u043C\u044F \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F \u0438 \u043F\u0430\u0440\u043E\u043B\u044C",
    pt: "Autentica\xE7\xE3o falhou \u2014 verifique utilizador e palavra-passe",
    nl: "Aanmelding mislukt \u2014 controleer gebruikersnaam en wachtwoord",
    fr: "\xC9chec de l'authentification \u2014 v\xE9rifiez nom d'utilisateur et mot de passe",
    it: "Autenticazione non riuscita \u2014 controlla nome utente e password",
    es: "Autenticaci\xF3n fall\xF3 \u2014 comprueba usuario y contrase\xF1a",
    pl: "Uwierzytelnianie nie powiod\u0142o si\u0119 \u2014 sprawd\u017A nazw\u0119 u\u017Cytkownika i has\u0142o",
    uk: "\u041F\u043E\u043C\u0438\u043B\u043A\u0430 \u0430\u0432\u0442\u0435\u043D\u0442\u0438\u0444\u0456\u043A\u0430\u0446\u0456\u0457 \u2014 \u043F\u0435\u0440\u0435\u0432\u0456\u0440\u0442\u0435 \u0456\u043C'\u044F \u043A\u043E\u0440\u0438\u0441\u0442\u0443\u0432\u0430\u0447\u0430 \u0442\u0430 \u043F\u0430\u0440\u043E\u043B\u044C",
    "zh-cn": "\u8EAB\u4EFD\u9A8C\u8BC1\u5931\u8D25 \u2014 \u8BF7\u68C0\u67E5\u7528\u6237\u540D\u548C\u5BC6\u7801"
  },
  authSuppressed: {
    en: "Authentication keeps failing \u2014 suppressing further auth errors",
    de: "Authentifizierung scheitert weiterhin \u2014 weitere Auth-Fehler werden unterdr\xFCckt",
    ru: "\u0410\u0443\u0442\u0435\u043D\u0442\u0438\u0444\u0438\u043A\u0430\u0446\u0438\u044F \u043F\u0440\u043E\u0434\u043E\u043B\u0436\u0430\u0435\u0442 \u0434\u0430\u0432\u0430\u0442\u044C \u0441\u0431\u043E\u0439 \u2014 \u0434\u0430\u043B\u044C\u043D\u0435\u0439\u0448\u0438\u0435 \u043E\u0448\u0438\u0431\u043A\u0438 auth \u043F\u043E\u0434\u0430\u0432\u043B\u044F\u044E\u0442\u0441\u044F",
    pt: "Autentica\xE7\xE3o continua a falhar \u2014 futuros erros de auth ser\xE3o suprimidos",
    nl: "Aanmelding blijft mislukken \u2014 verdere auth-fouten worden onderdrukt",
    fr: "L'authentification continue d'\xE9chouer \u2014 les erreurs auth suivantes seront masqu\xE9es",
    it: "L'autenticazione continua a fallire \u2014 ulteriori errori di auth verranno soppressi",
    es: "La autenticaci\xF3n sigue fallando \u2014 se suprimir\xE1n los pr\xF3ximos errores de auth",
    pl: "Uwierzytelnianie ci\u0105gle zawodzi \u2014 dalsze b\u0142\u0119dy auth s\u0105 pomijane",
    uk: "\u0410\u0432\u0442\u0435\u043D\u0442\u0438\u0444\u0456\u043A\u0430\u0446\u0456\u044F \u043F\u0440\u043E\u0434\u043E\u0432\u0436\u0443\u0454 \u043D\u0435\u0432\u0434\u0430\u043B\u043E \u2014 \u043F\u043E\u0434\u0430\u043B\u044C\u0448\u0456 auth-\u043F\u043E\u043C\u0438\u043B\u043A\u0438 \u043F\u0440\u0438\u0434\u0443\u0448\u0443\u044E\u0442\u044C\u0441\u044F",
    "zh-cn": "\u8EAB\u4EFD\u9A8C\u8BC1\u6301\u7EED\u5931\u8D25 \u2014 \u540E\u7EED auth \u9519\u8BEF\u5C06\u88AB\u6291\u5236"
  },
  // ──────── Per-system update ────────
  systemUpdateFailed: {
    en: "Failed to update system '{name}': {error}",
    de: "Aktualisierung von System '{name}' fehlgeschlagen: {error}",
    ru: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u0431\u043D\u043E\u0432\u0438\u0442\u044C \u0441\u0438\u0441\u0442\u0435\u043C\u0443 '{name}': {error}",
    pt: "Falha ao atualizar sistema '{name}': {error}",
    nl: "Bijwerken van systeem '{name}' is mislukt: {error}",
    fr: "\xC9chec de la mise \xE0 jour du syst\xE8me '{name}' : {error}",
    it: "Impossibile aggiornare il sistema '{name}': {error}",
    es: "Error al actualizar el sistema '{name}': {error}",
    pl: "Nie uda\u0142o si\u0119 zaktualizowa\u0107 systemu '{name}': {error}",
    uk: "\u041D\u0435 \u0432\u0434\u0430\u043B\u043E\u0441\u044F \u043E\u043D\u043E\u0432\u0438\u0442\u0438 \u0441\u0438\u0441\u0442\u0435\u043C\u0443 '{name}': {error}",
    "zh-cn": "\u65E0\u6CD5\u66F4\u65B0\u7CFB\u7EDF '{name}'\uFF1A{error}"
  },
  systemSkipped: {
    en: "Skipping system with unusable name: {name}",
    de: "System mit unbrauchbarem Namen \xFCbersprungen: {name}",
    ru: "\u041F\u0440\u043E\u043F\u0443\u0449\u0435\u043D\u0430 \u0441\u0438\u0441\u0442\u0435\u043C\u0430 \u0441 \u043D\u0435\u043F\u0440\u0438\u0433\u043E\u0434\u043D\u044B\u043C \u0438\u043C\u0435\u043D\u0435\u043C: {name}",
    pt: "Sistema com nome inutiliz\xE1vel ignorado: {name}",
    nl: "Systeem met onbruikbare naam overgeslagen: {name}",
    fr: "Syst\xE8me avec nom inutilisable ignor\xE9 : {name}",
    it: "Sistema con nome inutilizzabile saltato: {name}",
    es: "Saltando sistema con nombre inutilizable: {name}",
    pl: "Pomini\u0119to system o niew\u0142a\u015Bciwej nazwie: {name}",
    uk: "\u041F\u0440\u043E\u043F\u0443\u0449\u0435\u043D\u043E \u0441\u0438\u0441\u0442\u0435\u043C\u0443 \u0437 \u043D\u0435\u043F\u0440\u0438\u0434\u0430\u0442\u043D\u0438\u043C \u0456\u043C\u0435\u043D\u0435\u043C: {name}",
    "zh-cn": "\u8DF3\u8FC7\u540D\u79F0\u65E0\u6548\u7684\u7CFB\u7EDF\uFF1A{name}"
  },
  // ──────── Migration ────────
  legacyMigrated: {
    en: "Migration: removed {count} legacy state(s) from flat structure",
    de: "Migration: {count} alte(r) Datenpunkt(e) aus flacher Struktur entfernt",
    ru: "\u041C\u0438\u0433\u0440\u0430\u0446\u0438\u044F: \u0443\u0434\u0430\u043B\u0435\u043D\u043E {count} \u0443\u0441\u0442\u0430\u0440\u0435\u0432\u0448\u0438\u0445 \u0434\u0430\u0442\u0447\u0438\u043A(\u043E\u0432) \u0438\u0437 \u043F\u043B\u043E\u0441\u043A\u043E\u0439 \u0441\u0442\u0440\u0443\u043A\u0442\u0443\u0440\u044B",
    pt: "Migra\xE7\xE3o: removido(s) {count} datapoint(s) antigo(s) da estrutura plana",
    nl: "Migratie: {count} oude datapoint(s) uit platte structuur verwijderd",
    fr: "Migration : suppression de {count} ancien(s) datapoint(s) de la structure plate",
    it: "Migrazione: rimosso(i) {count} vecchio(i) datapoint dalla struttura piatta",
    es: "Migraci\xF3n: eliminado(s) {count} datapoint(s) antiguo(s) de la estructura plana",
    pl: "Migracja: usuni\u0119to {count} stary(ch) datapoint(\xF3w) z p\u0142askiej struktury",
    uk: "\u041C\u0456\u0433\u0440\u0430\u0446\u0456\u044F: \u0432\u0438\u0434\u0430\u043B\u0435\u043D\u043E {count} \u0437\u0430\u0441\u0442\u0430\u0440\u0456\u043B\u0438\u0445 \u0434\u0430\u0442\u0430\u043F\u043E\u0456\u043D\u0442(\u0456\u0432) \u0437 \u043F\u043B\u043E\u0441\u043A\u043E\u0457 \u0441\u0442\u0440\u0443\u043A\u0442\u0443\u0440\u0438",
    "zh-cn": "\u8FC1\u79FB\uFF1A\u5DF2\u4ECE\u6241\u5E73\u7ED3\u6784\u4E2D\u79FB\u9664 {count} \u4E2A\u65E7\u6570\u636E\u70B9"
  }
};
function tLog(lang, key, params) {
  var _a;
  const langKey = SUPPORTED_LANGS.includes(lang) ? lang : "en";
  const bundle = LOG_STRINGS[key];
  const template = (_a = bundle[langKey]) != null ? _a : bundle.en;
  return fmt(template, params);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  LOG_STRINGS,
  tLog
});
//# sourceMappingURL=i18n-logs.js.map

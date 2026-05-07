"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var utils = __toESM(require("@iobroker/adapter-core"));
var import_beszel_client = require("./lib/beszel-client");
var import_coerce = require("./lib/coerce");
var import_i18n_logs = require("./lib/i18n-logs");
var import_state_manager = require("./lib/state-manager");
class BeszelAdapter extends utils.Adapter {
  client = null;
  stateManager = null;
  pollTimer = void 0;
  isPolling = false;
  lastSystemCount = 0;
  lastErrorCode = "";
  authFailCount = 0;
  failedSystems = /* @__PURE__ */ new Set();
  unhandledRejectionHandler = null;
  uncaughtExceptionHandler = null;
  systemLang = "en";
  constructor(options = {}) {
    super({
      ...options,
      name: "beszel"
    });
    this.on("ready", () => {
      this.onReady().catch(
        (err) => this.log.error((0, import_i18n_logs.tLog)(this.systemLang, "onReadyFailed", { error: (0, import_coerce.errText)(err) }))
      );
    });
    this.on("unload", this.onUnload.bind(this));
    this.on("message", (obj) => {
      this.onMessage(obj).catch(
        (err) => this.log.error((0, import_i18n_logs.tLog)(this.systemLang, "onMessageFailed", { error: (0, import_coerce.errText)(err) }))
      );
    });
    this.unhandledRejectionHandler = (reason) => {
      this.log.error((0, import_i18n_logs.tLog)(this.systemLang, "unhandledRejection", { error: (0, import_coerce.errText)(reason) }));
    };
    this.uncaughtExceptionHandler = (err) => {
      this.log.error((0, import_i18n_logs.tLog)(this.systemLang, "uncaughtException", { error: (0, import_coerce.errText)(err) }));
    };
    process.on("unhandledRejection", this.unhandledRejectionHandler);
    process.on("uncaughtException", this.uncaughtExceptionHandler);
  }
  async onReady() {
    var _a, _b, _c;
    const config = this.config;
    try {
      const sys = await this.getForeignObjectAsync("system.config");
      const lang = (_a = sys == null ? void 0 : sys.common) == null ? void 0 : _a.language;
      if (typeof lang === "string" && lang.length > 0) {
        this.systemLang = lang;
      }
    } catch {
    }
    await this.setStateAsync("info.connection", { val: false, ack: true });
    if (!config.url || !config.username || !config.password) {
      this.log.error((0, import_i18n_logs.tLog)(this.systemLang, "configIncomplete"));
      return;
    }
    this.client = new import_beszel_client.BeszelClient(config.url, config.username, config.password);
    this.stateManager = new import_state_manager.StateManager(this, this.systemLang);
    await this.stateManager.migrateLegacyStates();
    for (const name of await this.stateManager.getExistingSystemNames()) {
      await this.stateManager.cleanupMetrics(name, config);
    }
    await this.poll();
    const intervalMs = Math.max(10, (_b = config.pollInterval) != null ? _b : 60) * 1e3;
    this.pollTimer = this.setInterval(() => {
      void this.poll();
    }, intervalMs);
    this.log.info(
      (0, import_i18n_logs.tLog)(this.systemLang, "adapterStarted", {
        count: this.lastSystemCount,
        seconds: (_c = config.pollInterval) != null ? _c : 60
      })
    );
  }
  onUnload(callback) {
    try {
      if (this.pollTimer) {
        this.clearInterval(this.pollTimer);
        this.pollTimer = void 0;
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
    }
    callback();
  }
  async onMessage(obj) {
    var _a, _b, _c;
    if (!obj.callback) {
      return;
    }
    try {
      if (obj.command === "checkConnection") {
        const config = obj.message;
        const url = (_a = config.url) != null ? _a : "";
        const username = (_b = config.username) != null ? _b : "";
        const password = (_c = config.password) != null ? _c : "";
        if (!url || !username || !password) {
          this.sendTo(
            obj.from,
            obj.command,
            {
              success: false,
              message: "URL, username and password are required"
            },
            obj.callback
          );
          return;
        }
        const testClient = new import_beszel_client.BeszelClient(url, username, password);
        const result = await testClient.checkConnection();
        this.sendTo(obj.from, obj.command, result, obj.callback);
      }
    } catch (err) {
      this.sendTo(obj.from, obj.command, { success: false, message: (0, import_coerce.errText)(err) }, obj.callback);
    }
  }
  /**
   * Classify an error for deduplication and log-level decisions.
   *
   * @param err The error to classify
   */
  classifyError(err) {
    if (!(err instanceof Error)) {
      return "UNKNOWN";
    }
    const code = err.code;
    if (code === "UNAUTHORIZED") {
      return "UNAUTHORIZED";
    }
    if (code === "ENOTFOUND" || code === "ECONNREFUSED" || code === "ECONNRESET" || code === "ENETUNREACH" || code === "EHOSTUNREACH" || code === "EAI_AGAIN") {
      return "NETWORK";
    }
    if (code === "ETIMEDOUT" || err.message.includes("timed out")) {
      return "TIMEOUT";
    }
    return code || "UNKNOWN";
  }
  async poll() {
    var _a;
    if (this.isPolling) {
      this.log.debug("Skipping poll \u2014 previous poll still running");
      return;
    }
    if (!this.client || !this.stateManager) {
      return;
    }
    this.isPolling = true;
    try {
      const config = this.config;
      const [systems, containers] = await Promise.all([
        this.client.getSystems(),
        config.metrics_containers ? this.client.getContainers() : Promise.resolve([])
      ]);
      const systemIds = systems.map((s) => s.id);
      const statsMap = await this.client.getLatestStats(systemIds);
      await this.setStateAsync("info.connection", { val: true, ack: true });
      for (const system of systems) {
        try {
          const stats = statsMap.get(system.id);
          await this.stateManager.updateSystem(system, stats, containers, config);
          this.failedSystems.delete(system.name);
        } catch (err) {
          const msg = (0, import_i18n_logs.tLog)(this.systemLang, "systemUpdateFailed", {
            name: system.name,
            error: (0, import_coerce.errText)(err)
          });
          if (this.failedSystems.has(system.name)) {
            this.log.debug(msg);
          } else {
            this.log.warn(msg);
            this.failedSystems.add(system.name);
          }
        }
      }
      if (systems.length > 0 || this.lastSystemCount === 0) {
        await this.stateManager.cleanupSystems(systems.map((s) => s.name));
      }
      this.lastSystemCount = systems.length;
      this.authFailCount = 0;
      if (this.lastErrorCode) {
        this.log.info((0, import_i18n_logs.tLog)(this.systemLang, "connectionRestored"));
        this.lastErrorCode = "";
      }
      this.log.debug(`Polled ${systems.length} systems successfully`);
    } catch (err) {
      const errMsg = (0, import_coerce.errText)(err);
      const errorCode = this.classifyError(err);
      const isRepeat = errorCode === this.lastErrorCode;
      this.lastErrorCode = errorCode;
      if (errorCode === "UNAUTHORIZED") {
        (_a = this.client) == null ? void 0 : _a.invalidateToken();
        this.authFailCount++;
        if (this.authFailCount <= 3) {
          this.log.error((0, import_i18n_logs.tLog)(this.systemLang, "authFailed"));
        } else if (this.authFailCount === 4) {
          this.log.error((0, import_i18n_logs.tLog)(this.systemLang, "authSuppressed"));
        } else {
          this.log.debug(`Auth still failing (attempt ${this.authFailCount})`);
        }
      } else if (isRepeat) {
        this.log.debug(`Poll failed (ongoing): ${errMsg}`);
      } else if (errorCode === "NETWORK") {
        this.log.warn((0, import_i18n_logs.tLog)(this.systemLang, "cannotReach"));
      } else {
        this.log.error((0, import_i18n_logs.tLog)(this.systemLang, "pollFailed", { error: errMsg }));
      }
      await this.setStateAsync("info.connection", { val: false, ack: true });
    } finally {
      this.isPolling = false;
    }
  }
}
if (require.main !== module) {
  module.exports = (options) => new BeszelAdapter(options);
} else {
  (() => new BeszelAdapter())();
}
//# sourceMappingURL=main.js.map

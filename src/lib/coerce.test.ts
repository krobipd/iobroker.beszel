import { expect } from "chai";
import {
  coerceArray,
  coerceAuthResponse,
  coerceBoolean,
  coerceContainer,
  coerceFiniteNumber,
  coerceNumberArray,
  coerceNumberMap,
  coerceNumberTuple,
  coerceObject,
  coercePocketBaseList,
  coercePollInterval,
  coerceString,
  coerceSystem,
  coerceSystemStats,
  coerceSystemStatsRecord,
  coerceTimeoutMs,
  errText,
  validateHubUrl,
} from "./coerce";

describe("coerce", () => {
  // -----------------------------------------------------------------------
  // coerceFiniteNumber
  // -----------------------------------------------------------------------

  describe("coerceFiniteNumber", () => {
    it("returns the number when finite", () => {
      expect(coerceFiniteNumber(42)).to.equal(42);
      expect(coerceFiniteNumber(-3.14)).to.equal(-3.14);
      expect(coerceFiniteNumber(0)).to.equal(0);
    });

    it("returns null for NaN", () => {
      expect(coerceFiniteNumber(NaN)).to.be.null;
    });

    it("returns null for Infinity and -Infinity", () => {
      expect(coerceFiniteNumber(Infinity)).to.be.null;
      expect(coerceFiniteNumber(-Infinity)).to.be.null;
    });

    it("parses numeric strings", () => {
      expect(coerceFiniteNumber("42")).to.equal(42);
      expect(coerceFiniteNumber("-3.14")).to.equal(-3.14);
    });

    it("returns null for non-numeric strings", () => {
      expect(coerceFiniteNumber("abc")).to.be.null;
      expect(coerceFiniteNumber("12abc")).to.be.null;
    });

    it("returns null for empty string", () => {
      expect(coerceFiniteNumber("")).to.be.null;
    });

    it("returns null for null and undefined", () => {
      expect(coerceFiniteNumber(null)).to.be.null;
      expect(coerceFiniteNumber(undefined)).to.be.null;
    });

    it("returns null for objects, arrays, booleans", () => {
      expect(coerceFiniteNumber({})).to.be.null;
      expect(coerceFiniteNumber([1])).to.be.null;
      expect(coerceFiniteNumber(true)).to.be.null;
    });
  });

  // -----------------------------------------------------------------------
  // coerceString
  // -----------------------------------------------------------------------

  describe("coerceString", () => {
    it("returns the string when non-empty", () => {
      expect(coerceString("hello")).to.equal("hello");
    });

    it("returns null for empty string", () => {
      expect(coerceString("")).to.be.null;
    });

    it("returns null for numbers, booleans, objects", () => {
      expect(coerceString(42)).to.be.null;
      expect(coerceString(true)).to.be.null;
      expect(coerceString({})).to.be.null;
      expect(coerceString([])).to.be.null;
    });

    it("returns null for null and undefined", () => {
      expect(coerceString(null)).to.be.null;
      expect(coerceString(undefined)).to.be.null;
    });

    it("caps length to maxLength", () => {
      const long = "x".repeat(2000);
      const result = coerceString(long, 1024);
      expect(result).to.have.lengthOf(1024);
    });

    it("does not cap strings shorter than maxLength", () => {
      expect(coerceString("short", 1024)).to.equal("short");
    });
  });

  // -----------------------------------------------------------------------
  // coerceBoolean
  // -----------------------------------------------------------------------

  describe("coerceBoolean", () => {
    it("returns true and false unchanged", () => {
      expect(coerceBoolean(true)).to.be.true;
      expect(coerceBoolean(false)).to.be.false;
    });

    it("returns null for truthy non-boolean values", () => {
      expect(coerceBoolean("true")).to.be.null;
      expect(coerceBoolean(1)).to.be.null;
      expect(coerceBoolean({})).to.be.null;
    });

    it("returns null for null, undefined, 0, empty string", () => {
      expect(coerceBoolean(null)).to.be.null;
      expect(coerceBoolean(undefined)).to.be.null;
      expect(coerceBoolean(0)).to.be.null;
      expect(coerceBoolean("")).to.be.null;
    });
  });

  // -----------------------------------------------------------------------
  // coerceObject
  // -----------------------------------------------------------------------

  describe("coerceObject", () => {
    it("returns a plain object as-is", () => {
      const obj = { a: 1 };
      expect(coerceObject(obj)).to.equal(obj);
    });

    it("returns null for arrays", () => {
      expect(coerceObject([])).to.be.null;
      expect(coerceObject([1, 2])).to.be.null;
    });

    it("returns null for null", () => {
      expect(coerceObject(null)).to.be.null;
    });

    it("returns null for primitives", () => {
      expect(coerceObject("x")).to.be.null;
      expect(coerceObject(42)).to.be.null;
      expect(coerceObject(true)).to.be.null;
      expect(coerceObject(undefined)).to.be.null;
    });
  });

  // -----------------------------------------------------------------------
  // coerceArray
  // -----------------------------------------------------------------------

  describe("coerceArray", () => {
    it("returns an array as-is", () => {
      const arr = [1, 2, 3];
      expect(coerceArray(arr)).to.equal(arr);
    });

    it("returns null for objects", () => {
      expect(coerceArray({})).to.be.null;
      expect(coerceArray({ length: 3 })).to.be.null;
    });

    it("returns null for null, undefined, primitives", () => {
      expect(coerceArray(null)).to.be.null;
      expect(coerceArray(undefined)).to.be.null;
      expect(coerceArray("x")).to.be.null;
      expect(coerceArray(42)).to.be.null;
    });
  });

  // -----------------------------------------------------------------------
  // coerceNumberTuple
  // -----------------------------------------------------------------------

  describe("coerceNumberTuple", () => {
    it("returns a tuple of finite numbers", () => {
      expect(coerceNumberTuple([1, 2, 3], 3)).to.deep.equal([1, 2, 3]);
    });

    it("accepts longer arrays and truncates to length", () => {
      expect(coerceNumberTuple([1, 2, 3, 4], 2)).to.deep.equal([1, 2]);
    });

    it("returns null when too short", () => {
      expect(coerceNumberTuple([1, 2], 3)).to.be.null;
    });

    it("returns null when any element is not finite", () => {
      expect(coerceNumberTuple([1, NaN, 3], 3)).to.be.null;
      expect(coerceNumberTuple([1, Infinity, 3], 3)).to.be.null;
      expect(coerceNumberTuple([1, null, 3], 3)).to.be.null;
      expect(coerceNumberTuple([1, "bad", 3], 3)).to.be.null;
    });

    it("returns null for non-array input", () => {
      expect(coerceNumberTuple({}, 3)).to.be.null;
      expect(coerceNumberTuple(null, 3)).to.be.null;
      expect(coerceNumberTuple("1,2,3", 3)).to.be.null;
    });
  });

  // -----------------------------------------------------------------------
  // coerceNumberArray
  // -----------------------------------------------------------------------

  describe("coerceNumberArray", () => {
    it("returns the array of finite numbers", () => {
      expect(coerceNumberArray([1, 2, 3, 4, 5])).to.deep.equal([1, 2, 3, 4, 5]);
    });

    it("returns empty array for empty input", () => {
      expect(coerceNumberArray([])).to.deep.equal([]);
    });

    it("returns null when any element is not finite", () => {
      expect(coerceNumberArray([1, NaN])).to.be.null;
      expect(coerceNumberArray([1, "bad"])).to.be.null;
    });

    it("returns null for non-array input", () => {
      expect(coerceNumberArray({})).to.be.null;
      expect(coerceNumberArray(null)).to.be.null;
    });
  });

  // -----------------------------------------------------------------------
  // coerceNumberMap
  // -----------------------------------------------------------------------

  describe("coerceNumberMap", () => {
    it("returns a map of finite number values", () => {
      expect(coerceNumberMap({ a: 1, b: 2.5 })).to.deep.equal({
        a: 1,
        b: 2.5,
      });
    });

    it("silently drops non-finite and wrong-type values", () => {
      expect(coerceNumberMap({ a: 1, b: NaN, c: "bad", d: null, e: 5 })).to.deep.equal({ a: 1, e: 5 });
    });

    it("returns empty map when all values invalid", () => {
      expect(coerceNumberMap({ a: NaN, b: "bad", c: null })).to.deep.equal({});
    });

    it("returns null for non-object input", () => {
      expect(coerceNumberMap([])).to.be.null;
      expect(coerceNumberMap(null)).to.be.null;
      expect(coerceNumberMap(42)).to.be.null;
    });
  });

  // -----------------------------------------------------------------------
  // coerceSystem
  // -----------------------------------------------------------------------

  describe("coerceSystem", () => {
    it("returns a fully-coerced system record", () => {
      const sys = coerceSystem({
        id: "abc",
        name: "server",
        status: "up",
        host: "192.168.1.1",
        info: { u: 3600, v: "0.8.0", la: [1, 2, 3] },
      });
      expect(sys).to.not.be.null;
      expect(sys!.id).to.equal("abc");
      expect(sys!.name).to.equal("server");
      expect(sys!.status).to.equal("up");
      expect(sys!.host).to.equal("192.168.1.1");
      expect(sys!.info.u).to.equal(3600);
      expect(sys!.info.la).to.deep.equal([1, 2, 3]);
    });

    it("returns null when id is missing", () => {
      expect(coerceSystem({ name: "server", status: "up" })).to.be.null;
    });

    it("returns null when name is missing", () => {
      expect(coerceSystem({ id: "abc", status: "up" })).to.be.null;
    });

    it("returns null when id or name is not a string", () => {
      expect(coerceSystem({ id: 42, name: "s" })).to.be.null;
      expect(coerceSystem({ id: "a", name: null })).to.be.null;
    });

    it("falls back to 'pending' for invalid status", () => {
      const sys = coerceSystem({ id: "a", name: "n", status: "weird" });
      expect(sys!.status).to.equal("pending");
    });

    it("defaults host to empty string when missing", () => {
      const sys = coerceSystem({ id: "a", name: "n" });
      expect(sys!.host).to.equal("");
    });

    it("drops info fields with non-finite values", () => {
      const sys = coerceSystem({
        id: "a",
        name: "n",
        info: { u: NaN, v: 42, la: [1, "bad", 3] },
      });
      expect(sys!.info.u).to.be.undefined;
      expect(sys!.info.v).to.be.undefined;
      expect(sys!.info.la).to.be.undefined;
    });

    it("returns null for non-object input", () => {
      expect(coerceSystem(null)).to.be.null;
      expect(coerceSystem([])).to.be.null;
      expect(coerceSystem("x")).to.be.null;
    });
  });

  // -----------------------------------------------------------------------
  // coerceSystemStats
  // -----------------------------------------------------------------------

  describe("coerceSystemStats", () => {
    it("returns fully-coerced stats", () => {
      const s = coerceSystemStats({
        cpu: 45.5,
        mu: 4,
        m: 16,
        mp: 25,
        la: [1, 2, 3],
        t: { cpu0: 50, gpu: 70 },
      });
      expect(s.cpu).to.equal(45.5);
      expect(s.mu).to.equal(4);
      expect(s.mp).to.equal(25);
      expect(s.la).to.deep.equal([1, 2, 3]);
      expect(s.t).to.deep.equal({ cpu0: 50, gpu: 70 });
    });

    it("drops individual NaN fields", () => {
      const s = coerceSystemStats({ cpu: NaN, mu: 4 });
      expect(s.cpu).to.be.undefined;
      expect(s.mu).to.equal(4);
    });

    it("drops individual Infinity fields", () => {
      const s = coerceSystemStats({ cpu: Infinity, mp: 50 });
      expect(s.cpu).to.be.undefined;
      expect(s.mp).to.equal(50);
    });

    it("drops la when any element is not finite", () => {
      const s = coerceSystemStats({ la: [1, NaN, 3] });
      expect(s.la).to.be.undefined;
    });

    it("filters temperature map but keeps valid entries", () => {
      const s = coerceSystemStats({
        t: { cpu: 50, gpu: NaN, fan: "hot" },
      });
      expect(s.t).to.deep.equal({ cpu: 50 });
    });

    it("coerces numeric strings in stats", () => {
      const s = coerceSystemStats({ cpu: "45.5" });
      expect(s.cpu).to.equal(45.5);
    });

    it("drops battery tuple when not 2 numbers", () => {
      const s = coerceSystemStats({ bat: [85] });
      expect(s.bat).to.be.undefined;
    });

    it("coerces cpub breakdown array", () => {
      const s = coerceSystemStats({ cpub: [10, 5, 2, 1, 82] });
      expect(s.cpub).to.deep.equal([10, 5, 2, 1, 82]);
    });

    it("drops cpub when any element is not finite", () => {
      const s = coerceSystemStats({ cpub: [10, 5, NaN, 1, 82] });
      expect(s.cpub).to.be.undefined;
    });

    it("handles GPU map with partial data", () => {
      const s = coerceSystemStats({
        g: {
          gpu0: { n: "NVIDIA", u: 45, mu: 2.5, mt: 8 },
          gpu1: { u: NaN },
        },
      });
      expect(s.g!.gpu0.n).to.equal("NVIDIA");
      expect(s.g!.gpu0.u).to.equal(45);
      expect(s.g!.gpu1.u).to.be.undefined;
    });

    it("returns empty stats for non-object input", () => {
      expect(coerceSystemStats(null)).to.deep.equal({});
      expect(coerceSystemStats([])).to.deep.equal({});
      expect(coerceSystemStats("x")).to.deep.equal({});
    });
  });

  // -----------------------------------------------------------------------
  // coerceSystemStatsRecord
  // -----------------------------------------------------------------------

  describe("coerceSystemStatsRecord", () => {
    it("returns the record with coerced stats", () => {
      const rec = coerceSystemStatsRecord({
        id: "s1",
        system: "sys001",
        type: "1m",
        stats: { cpu: 45 },
        updated: "2026-01-01T12:00:00Z",
      });
      expect(rec).to.not.be.null;
      expect(rec!.id).to.equal("s1");
      expect(rec!.system).to.equal("sys001");
      expect(rec!.stats.cpu).to.equal(45);
    });

    it("returns null when id is missing", () => {
      expect(coerceSystemStatsRecord({ system: "sys001", stats: {} })).to.be.null;
    });

    it("returns null when system reference is missing", () => {
      expect(coerceSystemStatsRecord({ id: "s1", stats: {} })).to.be.null;
    });

    it("defaults to empty stats for non-object stats field", () => {
      const rec = coerceSystemStatsRecord({
        id: "s1",
        system: "sys001",
        stats: "not an object",
      });
      expect(rec!.stats).to.deep.equal({});
    });
  });

  // -----------------------------------------------------------------------
  // coerceContainer
  // -----------------------------------------------------------------------

  describe("coerceContainer", () => {
    it("returns a fully-coerced container record", () => {
      const c = coerceContainer({
        id: "c1",
        system: "sys001",
        name: "nginx",
        status: "running",
        health: 2,
        cpu: 5,
        memory: 128,
        image: "nginx:latest",
      });
      expect(c).to.not.be.null;
      expect(c!.name).to.equal("nginx");
      expect(c!.cpu).to.equal(5);
      expect(c!.health).to.equal(2);
    });

    it("returns null when required fields are missing", () => {
      expect(coerceContainer({ system: "s", name: "n" })).to.be.null;
      expect(coerceContainer({ id: "c", name: "n" })).to.be.null;
      expect(coerceContainer({ id: "c", system: "s" })).to.be.null;
    });

    it("defaults numeric fields to 0 when missing or not finite", () => {
      const c = coerceContainer({
        id: "c1",
        system: "sys001",
        name: "nginx",
        health: NaN,
        cpu: "not a number",
      });
      expect(c!.health).to.equal(0);
      expect(c!.cpu).to.equal(0);
      expect(c!.memory).to.equal(0);
    });

    it("defaults status and image to fallback strings", () => {
      const c = coerceContainer({
        id: "c1",
        system: "sys001",
        name: "nginx",
      });
      expect(c!.status).to.equal("unknown");
      expect(c!.image).to.equal("");
    });
  });

  // -----------------------------------------------------------------------
  // coerceAuthResponse
  // -----------------------------------------------------------------------

  describe("coerceAuthResponse", () => {
    it("returns parsed auth response", () => {
      const auth = coerceAuthResponse({
        token: "abc123",
        record: { id: "u1", email: "a@b.com" },
      });
      expect(auth).to.not.be.null;
      expect(auth!.token).to.equal("abc123");
      expect(auth!.record.id).to.equal("u1");
      expect(auth!.record.email).to.equal("a@b.com");
    });

    it("returns null when token is missing", () => {
      expect(coerceAuthResponse({ record: {} })).to.be.null;
    });

    it("returns null when token is empty string", () => {
      expect(coerceAuthResponse({ token: "", record: {} })).to.be.null;
    });

    it("returns null when token is not a string", () => {
      expect(coerceAuthResponse({ token: 42, record: {} })).to.be.null;
      expect(coerceAuthResponse({ token: null, record: {} })).to.be.null;
    });

    it("defaults to empty record when record is missing or wrong type", () => {
      const auth = coerceAuthResponse({ token: "t" });
      expect(auth!.record.id).to.equal("");
      expect(auth!.record.email).to.equal("");
    });

    it("returns null for non-object input", () => {
      expect(coerceAuthResponse(null)).to.be.null;
      expect(coerceAuthResponse("string")).to.be.null;
      expect(coerceAuthResponse([])).to.be.null;
    });
  });

  // -----------------------------------------------------------------------
  // coercePocketBaseList
  // -----------------------------------------------------------------------

  describe("coercePocketBaseList", () => {
    it("coerces a valid list and filters null items", () => {
      const result = coercePocketBaseList(
        {
          page: 1,
          perPage: 50,
          totalItems: 3,
          totalPages: 1,
          items: [{ id: "a", name: "first" }, { id: "b", name: "second" }, { name: "missing-id" }],
        },
        coerceSystem,
      );
      expect(result.items).to.have.lengthOf(2);
      expect(result.items[0].id).to.equal("a");
      expect(result.items[1].id).to.equal("b");
    });

    it("returns empty list when items is not an array", () => {
      const result = coercePocketBaseList({ items: "not an array" }, coerceSystem);
      expect(result.items).to.deep.equal([]);
    });

    it("returns empty list for non-object input", () => {
      const result = coercePocketBaseList(null, coerceSystem);
      expect(result.items).to.deep.equal([]);
      expect(result.totalItems).to.equal(0);
    });

    it("returns empty list when items key is missing", () => {
      const result = coercePocketBaseList({ page: 1 }, coerceSystem);
      expect(result.items).to.deep.equal([]);
    });
  });

  // -----------------------------------------------------------------------
  // errText
  // -----------------------------------------------------------------------

  describe("errText", () => {
    it("returns the message of an Error instance", () => {
      expect(errText(new Error("boom"))).to.equal("boom");
    });

    it("returns the message of an Error subclass", () => {
      class MyErr extends Error {
        constructor() {
          super("typed");
        }
      }
      expect(errText(new MyErr())).to.equal("typed");
    });

    it("returns 'null' for null", () => {
      expect(errText(null)).to.equal("null");
    });

    it("returns 'undefined' for undefined", () => {
      expect(errText(undefined)).to.equal("undefined");
    });

    it("returns string values as-is", () => {
      expect(errText("plain")).to.equal("plain");
    });

    it("stringifies number/boolean/bigint", () => {
      expect(errText(42)).to.equal("42");
      expect(errText(true)).to.equal("true");
      expect(errText(BigInt(99))).to.equal("99");
    });

    it("JSON.stringifies plain objects", () => {
      expect(errText({ code: 500, msg: "nope" })).to.equal('{"code":500,"msg":"nope"}');
    });

    it("falls back to Object.prototype.toString for circular objects", () => {
      const a: Record<string, unknown> = { x: 1 };
      a.self = a;
      const result = errText(a);
      expect(result).to.equal("[object Object]");
    });
  });

  // -----------------------------------------------------------------------
  // validateHubUrl (v0.5.0 S1)
  // -----------------------------------------------------------------------

  describe("validateHubUrl", () => {
    it("accepts http and https URLs", () => {
      expect(validateHubUrl("http://localhost:8090")).to.be.null;
      expect(validateHubUrl("https://beszel.example.com")).to.be.null;
      expect(validateHubUrl("https://192.168.1.100:8090/")).to.be.null;
    });

    it("rejects empty / non-string", () => {
      expect(validateHubUrl("")).to.equal("URL is empty");
      expect(validateHubUrl("   ")).to.equal("URL is empty");
      expect(validateHubUrl(null)).to.equal("URL is empty");
      expect(validateHubUrl(undefined)).to.equal("URL is empty");
      expect(validateHubUrl(42)).to.equal("URL is empty");
    });

    it("rejects non-http(s) protocols", () => {
      expect(validateHubUrl("ftp://server")).to.match(/protocol 'ftp:'/);
      expect(validateHubUrl("ws://server")).to.match(/protocol 'ws:'/);
      expect(validateHubUrl("file:///etc/passwd")).to.match(/protocol 'file:'/);
    });

    it("rejects malformed URLs", () => {
      expect(validateHubUrl("not a url")).to.equal("URL is malformed");
      expect(validateHubUrl("://nohost")).to.equal("URL is malformed");
    });
  });

  // -----------------------------------------------------------------------
  // coercePollInterval (v0.5.0 S1 + K15)
  // -----------------------------------------------------------------------

  describe("coercePollInterval", () => {
    it("returns the value when in range", () => {
      expect(coercePollInterval(60)).to.equal(60);
      expect(coercePollInterval(10)).to.equal(10);
      expect(coercePollInterval(300)).to.equal(300);
    });

    it("parses numeric strings", () => {
      expect(coercePollInterval("90")).to.equal(90);
      expect(coercePollInterval("60.7")).to.equal(60);
    });

    it("clamps below 10 to 10", () => {
      expect(coercePollInterval(5)).to.equal(10);
      expect(coercePollInterval(0)).to.equal(10);
      expect(coercePollInterval(-100)).to.equal(10);
    });

    it("clamps above 300 to 300 (K15)", () => {
      expect(coercePollInterval(500)).to.equal(300);
      expect(coercePollInterval(99999)).to.equal(300);
      expect(coercePollInterval("9999")).to.equal(300);
    });

    it("returns default 60 for non-finite / unparseable", () => {
      expect(coercePollInterval(NaN)).to.equal(60);
      expect(coercePollInterval(Infinity)).to.equal(60);
      expect(coercePollInterval(null)).to.equal(60);
      expect(coercePollInterval(undefined)).to.equal(60);
      expect(coercePollInterval("not a number")).to.equal(60);
      expect(coercePollInterval({})).to.equal(60);
    });
  });

  // -----------------------------------------------------------------------
  // coerceTimeoutMs (v0.5.0 S1)
  // -----------------------------------------------------------------------

  describe("coerceTimeoutMs", () => {
    it("converts seconds to ms", () => {
      expect(coerceTimeoutMs(15)).to.equal(15_000);
      expect(coerceTimeoutMs(5)).to.equal(5_000);
      expect(coerceTimeoutMs(120)).to.equal(120_000);
    });

    it("parses numeric strings", () => {
      expect(coerceTimeoutMs("30")).to.equal(30_000);
    });

    it("clamps below 5 to 5s", () => {
      expect(coerceTimeoutMs(1)).to.equal(5_000);
      expect(coerceTimeoutMs(-5)).to.equal(5_000);
    });

    it("clamps above 120 to 120s", () => {
      expect(coerceTimeoutMs(600)).to.equal(120_000);
      expect(coerceTimeoutMs(99999)).to.equal(120_000);
    });

    it("returns default 15s for non-finite / unparseable", () => {
      expect(coerceTimeoutMs(NaN)).to.equal(15_000);
      expect(coerceTimeoutMs(undefined)).to.equal(15_000);
      expect(coerceTimeoutMs("not a number")).to.equal(15_000);
    });
  });
});

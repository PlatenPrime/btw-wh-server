import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { parseBrowserTransportByKonk, resolveBrowserTransport, } from "../resolveBrowserTransport.js";
describe("parseBrowserTransportByKonk", () => {
    it("пустая строка / undefined → пустая map", () => {
        expect(parseBrowserTransportByKonk(undefined).size).toBe(0);
        expect(parseBrowserTransportByKonk("").size).toBe(0);
        expect(parseBrowserTransportByKonk("   ").size).toBe(0);
    });
    it("парсит пары konk:transport", () => {
        const map = parseBrowserTransportByKonk("air:playwright, balun:http, YUMI:Playwright");
        expect(map.get("air")).toBe("playwright");
        expect(map.get("balun")).toBe("http");
        expect(map.get("yumi")).toBe("playwright");
        expect(map.size).toBe(3);
    });
    it("игнорирует невалидный transport и malformed entry", () => {
        const map = parseBrowserTransportByKonk("air:selenium, :playwright, noColon, foo:playwright");
        expect(map.get("air")).toBeUndefined();
        expect(map.get("foo")).toBe("playwright");
        expect(map.size).toBe(1);
    });
});
describe("resolveBrowserTransport", () => {
    const original = process.env.BROWSER_TRANSPORT_BY_KONK;
    beforeEach(() => {
        delete process.env.BROWSER_TRANSPORT_BY_KONK;
    });
    afterEach(() => {
        if (original === undefined) {
            delete process.env.BROWSER_TRANSPORT_BY_KONK;
        }
        else {
            process.env.BROWSER_TRANSPORT_BY_KONK = original;
        }
    });
    it("без konk / пустой konk → http", () => {
        process.env.BROWSER_TRANSPORT_BY_KONK = "air:playwright";
        expect(resolveBrowserTransport()).toBe("http");
        expect(resolveBrowserTransport("")).toBe("http");
        expect(resolveBrowserTransport("   ")).toBe("http");
    });
    it("неизвестный konk → http", () => {
        process.env.BROWSER_TRANSPORT_BY_KONK = "air:playwright";
        expect(resolveBrowserTransport("balun")).toBe("http");
    });
    it("известный konk из env", () => {
        process.env.BROWSER_TRANSPORT_BY_KONK = "Air:playwright,balun:http";
        expect(resolveBrowserTransport("air")).toBe("playwright");
        expect(resolveBrowserTransport(" AIR ")).toBe("playwright");
        expect(resolveBrowserTransport("balun")).toBe("http");
    });
    it("пустой env → http", () => {
        expect(resolveBrowserTransport("air")).toBe("http");
    });
});

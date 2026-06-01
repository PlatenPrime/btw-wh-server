import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as getServerEgressGeoModule from "../getServerEgressGeo.js";
import { isServerEgressGeoLogEnabled, logServerEgressGeo, } from "../logServerEgressGeo.js";
describe("isServerEgressGeoLogEnabled", () => {
    afterEach(() => {
        delete process.env.SERVER_EGRESS_GEO_LOG;
    });
    it("false когда env не задан", () => {
        expect(isServerEgressGeoLogEnabled()).toBe(false);
    });
    it("true когда SERVER_EGRESS_GEO_LOG=1", () => {
        process.env.SERVER_EGRESS_GEO_LOG = "1";
        expect(isServerEgressGeoLogEnabled()).toBe(true);
    });
});
describe("logServerEgressGeo", () => {
    let consoleLogSpy;
    let consoleWarnSpy;
    beforeEach(() => {
        consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => { });
        consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => { });
        delete process.env.SERVER_EGRESS_GEO_LOG;
    });
    afterEach(() => {
        consoleLogSpy.mockRestore();
        consoleWarnSpy.mockRestore();
        delete process.env.SERVER_EGRESS_GEO_LOG;
        vi.restoreAllMocks();
    });
    it("no-op без SERVER_EGRESS_GEO_LOG", async () => {
        const getGeoSpy = vi.spyOn(getServerEgressGeoModule, "getServerEgressGeo");
        await logServerEgressGeo("createRow");
        expect(getGeoSpy).not.toHaveBeenCalled();
        expect(consoleLogSpy).not.toHaveBeenCalled();
    });
    it("логирует geo при успехе", async () => {
        process.env.SERVER_EGRESS_GEO_LOG = "1";
        vi.spyOn(getServerEgressGeoModule, "getServerEgressGeo").mockResolvedValue({
            ip: "203.0.113.1",
            country: "United States",
            countryCode: "US",
            city: "Ashburn",
        });
        await logServerEgressGeo("createRow");
        expect(consoleLogSpy).toHaveBeenCalledWith("[ServerEgressGeo] createRow", expect.objectContaining({ countryCode: "US" }));
    });
    it("console.warn при отсутствии geo", async () => {
        process.env.SERVER_EGRESS_GEO_LOG = "1";
        vi.spyOn(getServerEgressGeoModule, "getServerEgressGeo").mockResolvedValue(null);
        await logServerEgressGeo("createRow");
        expect(consoleWarnSpy).toHaveBeenCalledWith("[ServerEgressGeo] createRow failed: no geo data");
    });
});

import dns from "dns";
import { afterEach, describe, expect, it, vi } from "vitest";
import { configureDnsForMongoSrv } from "../configureDnsForMongoSrv.js";
describe("configureDnsForMongoSrv", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });
    it("replaces loopback DNS with public resolvers", () => {
        vi.spyOn(dns, "getServers").mockReturnValue(["127.0.0.1"]);
        const setServers = vi.spyOn(dns, "setServers");
        configureDnsForMongoSrv();
        expect(setServers).toHaveBeenCalledWith(["8.8.8.8", "1.1.1.1"]);
    });
    it("does not change DNS when non-loopback servers exist", () => {
        vi.spyOn(dns, "getServers").mockReturnValue(["192.168.0.1"]);
        const setServers = vi.spyOn(dns, "setServers");
        configureDnsForMongoSrv();
        expect(setServers).not.toHaveBeenCalled();
    });
});

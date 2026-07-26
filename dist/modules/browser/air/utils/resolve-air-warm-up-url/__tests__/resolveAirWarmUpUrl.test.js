import { describe, expect, it } from "vitest";
import { resolveAirWarmUpUrl } from "../resolveAirWarmUpUrl.js";
describe("resolveAirWarmUpUrl", () => {
    it("берёт origin + / из product URL", () => {
        expect(resolveAirWarmUpUrl("https://airballoons.com.ua/ua/product/shar-assorti-neonovyj-10-26sm")).toBe("https://airballoons.com.ua/");
    });
});

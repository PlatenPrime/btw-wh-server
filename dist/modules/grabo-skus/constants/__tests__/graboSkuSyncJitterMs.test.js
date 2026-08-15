import { afterEach, describe, expect, it, vi } from "vitest";
import { GRABO_SKU_SYNC_JITTER_MAX_MS, GRABO_SKU_SYNC_JITTER_MIN_MS, getGraboSkuSyncJitterDelayMs, } from "../graboSkuSyncJitterMs.js";
describe("graboSkuSyncJitterMs", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });
    it("defines a positive jitter range with min less than max", () => {
        expect(GRABO_SKU_SYNC_JITTER_MIN_MS).toBe(2500);
        expect(GRABO_SKU_SYNC_JITTER_MAX_MS).toBe(7000);
        expect(GRABO_SKU_SYNC_JITTER_MIN_MS).toBeLessThan(GRABO_SKU_SYNC_JITTER_MAX_MS);
    });
    it("returns inclusive bounds via jitterMs", () => {
        vi.spyOn(Math, "random").mockReturnValue(0);
        expect(getGraboSkuSyncJitterDelayMs()).toBe(GRABO_SKU_SYNC_JITTER_MIN_MS);
        vi.spyOn(Math, "random").mockReturnValue(0.999999);
        expect(getGraboSkuSyncJitterDelayMs()).toBe(GRABO_SKU_SYNC_JITTER_MAX_MS);
    });
});

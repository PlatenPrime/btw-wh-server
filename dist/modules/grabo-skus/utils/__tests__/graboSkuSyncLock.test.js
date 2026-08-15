import { afterEach, describe, expect, it } from "vitest";
import { clearGraboSkuSyncForTests, isGraboSkuSyncRunning, releaseGraboSkuSync, tryAcquireGraboSkuSync, } from "../graboSkuSyncLock.js";
describe("graboSkuSyncLock", () => {
    afterEach(() => {
        clearGraboSkuSyncForTests();
    });
    it("acquires once and rejects the second caller", () => {
        expect(tryAcquireGraboSkuSync()).toBe(true);
        expect(isGraboSkuSyncRunning()).toBe(true);
        expect(tryAcquireGraboSkuSync()).toBe(false);
    });
    it("allows acquire after release", () => {
        expect(tryAcquireGraboSkuSync()).toBe(true);
        releaseGraboSkuSync();
        expect(isGraboSkuSyncRunning()).toBe(false);
        expect(tryAcquireGraboSkuSync()).toBe(true);
    });
});

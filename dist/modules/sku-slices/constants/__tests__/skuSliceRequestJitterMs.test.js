import { describe, expect, it } from "vitest";
import { SKU_SLICE_REQUEST_JITTER_MAX_MS, SKU_SLICE_REQUEST_JITTER_MIN_MS, } from "../skuSliceRequestJitterMs.js";
describe("skuSliceRequestJitterMs constants", () => {
    it("defines a positive jitter range with min less than max", () => {
        expect(SKU_SLICE_REQUEST_JITTER_MIN_MS).toBe(500);
        expect(SKU_SLICE_REQUEST_JITTER_MAX_MS).toBe(1500);
        expect(SKU_SLICE_REQUEST_JITTER_MIN_MS).toBeLessThan(SKU_SLICE_REQUEST_JITTER_MAX_MS);
    });
});

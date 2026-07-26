import { describe, expect, it } from "vitest";
import { AIR_CLIENT_HTML_MAX_CHARS } from "../../../../constants/airClientSlice.js";
import { putAirClientSkuSliceSchema } from "../putAirClientSkuSliceSchema.js";
describe("putAirClientSkuSliceSchema", () => {
    const valid = {
        skuId: "507f1f77bcf86cd799439011",
        sourceUrl: "https://airballoons.com.ua/ua/product/x",
        html: "<html><body>ok</body></html>",
    };
    it("accepts valid payload", () => {
        const result = putAirClientSkuSliceSchema.safeParse(valid);
        expect(result.success).toBe(true);
    });
    it("rejects invalid skuId", () => {
        const result = putAirClientSkuSliceSchema.safeParse({
            ...valid,
            skuId: "bad",
        });
        expect(result.success).toBe(false);
    });
    it("rejects empty html", () => {
        const result = putAirClientSkuSliceSchema.safeParse({
            ...valid,
            html: "",
        });
        expect(result.success).toBe(false);
    });
    it("rejects html above max length", () => {
        const result = putAirClientSkuSliceSchema.safeParse({
            ...valid,
            html: "x".repeat(AIR_CLIENT_HTML_MAX_CHARS + 1),
        });
        expect(result.success).toBe(false);
    });
    it("rejects invalid sourceUrl", () => {
        const result = putAirClientSkuSliceSchema.safeParse({
            ...valid,
            sourceUrl: "not-url",
        });
        expect(result.success).toBe(false);
    });
});

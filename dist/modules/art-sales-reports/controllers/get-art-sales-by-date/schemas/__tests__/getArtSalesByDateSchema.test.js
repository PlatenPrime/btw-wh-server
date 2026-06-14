import { describe, expect, it } from "vitest";
import { getArtSalesByDateSchema } from "../getArtSalesByDateSchema.js";
describe("getArtSalesByDateSchema", () => {
    it("accepts artikul and date", () => {
        const r = getArtSalesByDateSchema.safeParse({
            artikul: "ART-1",
            date: "2026-03-01",
        });
        expect(r.success).toBe(true);
    });
});

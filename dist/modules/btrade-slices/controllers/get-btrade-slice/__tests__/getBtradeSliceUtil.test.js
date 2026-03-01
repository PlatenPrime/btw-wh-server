import { beforeEach, describe, expect, it } from "vitest";
import { BtradeSlice } from "../../../models/BtradeSlice.js";
import { getBtradeSliceUtil } from "../utils/getBtradeSliceUtil.js";
describe("getBtradeSliceUtil", () => {
    beforeEach(async () => {
        await BtradeSlice.deleteMany({});
    });
    it("returns slice when found by date", async () => {
        const date = new Date("2025-03-01T00:00:00.000Z");
        await BtradeSlice.create({
            date,
            data: { "ART-1": { price: 100, quantity: 5 } },
        });
        const result = await getBtradeSliceUtil({ date });
        expect(result).not.toBeNull();
        expect(result.date).toEqual(date);
        expect(result.data).toEqual({ "ART-1": { price: 100, quantity: 5 } });
    });
    it("returns null when no slice for given date", async () => {
        const result = await getBtradeSliceUtil({
            date: new Date("2025-03-01T00:00:00.000Z"),
        });
        expect(result).toBeNull();
    });
});

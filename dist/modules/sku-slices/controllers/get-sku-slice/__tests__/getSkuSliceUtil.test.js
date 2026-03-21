import { beforeEach, describe, expect, it } from "vitest";
import { SkuSlice } from "../../../models/SkuSlice.js";
import { getSkuSliceUtil } from "../utils/getSkuSliceUtil.js";
describe("getSkuSliceUtil", () => {
    beforeEach(async () => {
        await SkuSlice.deleteMany({});
    });
    it("returns slice when found by konkName and date", async () => {
        const date = new Date("2025-03-01T00:00:00.000Z");
        await SkuSlice.create({
            konkName: "air",
            date,
            data: { "air-1": { stock: 10, price: 100 } },
        });
        const result = await getSkuSliceUtil({
            konkName: "air",
            date: new Date("2025-03-01T15:00:00.000Z"),
        });
        expect(result).not.toBeNull();
        expect(result.konkName).toBe("air");
        expect(result.date.getTime()).toBe(date.getTime());
        expect(result.data).toEqual({ "air-1": { stock: 10, price: 100 } });
    });
    it("returns null when no slice for given konkName and date", async () => {
        const result = await getSkuSliceUtil({
            konkName: "air",
            date: new Date("2025-03-01T00:00:00.000Z"),
        });
        expect(result).toBeNull();
    });
});

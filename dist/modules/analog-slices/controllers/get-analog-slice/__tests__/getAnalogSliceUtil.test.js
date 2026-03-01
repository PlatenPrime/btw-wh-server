import { beforeEach, describe, expect, it } from "vitest";
import { AnalogSlice } from "../../../models/AnalogSlice.js";
import { getAnalogSliceUtil } from "../utils/getAnalogSliceUtil.js";
describe("getAnalogSliceUtil", () => {
    beforeEach(async () => {
        await AnalogSlice.deleteMany({});
    });
    it("returns slice when found by konkName and date", async () => {
        const date = new Date("2025-03-01T00:00:00.000Z");
        await AnalogSlice.create({
            konkName: "air",
            date,
            data: { id1: { stock: 10, price: 100 } },
        });
        const result = await getAnalogSliceUtil({
            konkName: "air",
            date,
        });
        expect(result).not.toBeNull();
        expect(result.konkName).toBe("air");
        expect(result.date).toEqual(date);
        expect(result.data).toEqual({ id1: { stock: 10, price: 100 } });
    });
    it("returns null when no slice for given konkName and date", async () => {
        const result = await getAnalogSliceUtil({
            konkName: "air",
            date: new Date("2025-03-01T00:00:00.000Z"),
        });
        expect(result).toBeNull();
    });
});

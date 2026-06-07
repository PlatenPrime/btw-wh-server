import { beforeEach, describe, expect, it } from "vitest";
import { toSliceDate } from "../../../../utils/sliceDate.js";
import { Skugr } from "../../../skugrs/models/Skugr.js";
import { Sku } from "../../models/Sku.js";
import { buildSkuListMongoFilter } from "../buildSkuListMongoFilter.js";
describe("buildSkuListMongoFilter", () => {
    beforeEach(async () => {
        await Sku.deleteMany({});
        await Skugr.deleteMany({});
    });
    it("returns empty filter when no criteria", async () => {
        const filter = await buildSkuListMongoFilter({});
        expect(filter).toEqual({});
    });
    it("applies konkName, prodName, search, isInvalid, createdFrom", async () => {
        const filter = await buildSkuListMongoFilter({
            konkName: "air",
            prodName: "maker",
            search: "widget",
            isInvalid: true,
            createdFrom: toSliceDate(new Date("2026-01-01")),
        });
        expect(filter.konkName).toBe("air");
        expect(filter.prodName).toBe("maker");
        expect(filter.title).toEqual({ $regex: "widget", $options: "i" });
        expect(filter.isInvalid).toBe(true);
        expect(filter.createdAt).toEqual({
            $gte: toSliceDate(new Date("2026-01-01")),
        });
    });
    it("notInAnySkugr adds $nin when skugr references exist", async () => {
        const referenced = await Sku.create({
            konkName: "k1",
            prodName: "p1",
            productId: "k1-ref",
            title: "Referenced",
            url: "https://k1.com/ref",
        });
        await Sku.create({
            konkName: "k1",
            prodName: "p1",
            productId: "k1-orphan",
            title: "Orphan",
            url: "https://k1.com/orphan",
        });
        await Skugr.create({
            konkName: "k1",
            prodName: "p1",
            title: "G",
            url: "https://k1.com/g",
            skus: [referenced._id],
        });
        const filter = await buildSkuListMongoFilter({ notInAnySkugr: true });
        expect(filter._id).toEqual({ $nin: [referenced._id] });
    });
    it("notInAnySkugr omits _id when no skugr references", async () => {
        const filter = await buildSkuListMongoFilter({ notInAnySkugr: true });
        expect(filter).not.toHaveProperty("_id");
    });
});

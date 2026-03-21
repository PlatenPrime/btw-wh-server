import { beforeEach, describe, expect, it } from "vitest";
import { Sku } from "../../../../../skus/models/Sku.js";
import { Skugr } from "../../../../models/Skugr.js";
import { InvalidSkuReferencesError, createSkugrUtil, } from "../createSkugrUtil.js";
describe("createSkugrUtil", () => {
    beforeEach(async () => {
        await Skugr.deleteMany({});
        await Sku.deleteMany({});
    });
    it("creates skugr with empty skus", async () => {
        const doc = await createSkugrUtil({
            konkName: "k1",
            prodName: "p1",
            title: "G",
            url: "https://k1.com/g",
            skus: [],
        });
        expect(doc.title).toBe("G");
        expect(doc.skus).toHaveLength(0);
    });
    it("deduplicates sku ids", async () => {
        const sku = await Sku.create({
            konkName: "k1",
            prodName: "p1",
            productId: "k1-skugr-util",
            title: "S",
            url: "https://k1.com/s",
        });
        const id = sku._id.toString();
        const doc = await createSkugrUtil({
            konkName: "k1",
            prodName: "p1",
            title: "G",
            url: "https://k1.com/g2",
            skus: [id, id],
        });
        expect(doc.skus).toHaveLength(1);
    });
    it("throws when sku id missing", async () => {
        const fakeId = "507f1f77bcf86cd799439011";
        await expect(createSkugrUtil({
            konkName: "k1",
            prodName: "p1",
            title: "G",
            url: "https://k1.com/g3",
            skus: [fakeId],
        })).rejects.toBeInstanceOf(InvalidSkuReferencesError);
    });
});

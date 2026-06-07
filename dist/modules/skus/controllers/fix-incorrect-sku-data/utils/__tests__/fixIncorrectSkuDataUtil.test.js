import { beforeEach, describe, expect, it } from "vitest";
import { Sku } from "../../../../models/Sku.js";
import { fixIncorrectSkuDataUtil } from "../fixIncorrectSkuDataUtil.js";
describe("fixIncorrectSkuDataUtil", () => {
    beforeEach(async () => {
        await Sku.deleteMany({});
    });
    it("updates skus matching filter", async () => {
        await Sku.create({
            konkName: "old-k",
            prodName: "old-p",
            productId: "old-k-1",
            title: "Old title",
            url: "https://old.com/1",
        });
        await Sku.create({
            konkName: "other",
            prodName: "p",
            productId: "other-1",
            title: "Other",
            url: "https://other.com/1",
        });
        const result = await fixIncorrectSkuDataUtil({
            filter: { konkName: "old-k", search: "title" },
            updates: { konkName: "new-k", title: "Fixed title" },
        });
        expect(result.matchedCount).toBe(1);
        expect(result.modifiedCount).toBe(1);
        const updated = await Sku.findOne({ productId: "old-k-1" }).lean();
        expect(updated?.konkName).toBe("new-k");
        expect(updated?.title).toBe("Fixed title");
    });
    it("filters by productIds array", async () => {
        await Sku.create({
            konkName: "k1",
            prodName: "p1",
            productId: "k1-a",
            title: "A",
            url: "https://k1.com/a",
            btradeAnalog: "",
        });
        await Sku.create({
            konkName: "k1",
            prodName: "p1",
            productId: "k1-b",
            title: "B",
            url: "https://k1.com/b",
            btradeAnalog: "",
        });
        const result = await fixIncorrectSkuDataUtil({
            filter: { productIds: ["k1-a"] },
            updates: { btradeAnalog: "BT-1" },
        });
        expect(result.modifiedCount).toBe(1);
        const a = await Sku.findOne({ productId: "k1-a" }).lean();
        const b = await Sku.findOne({ productId: "k1-b" }).lean();
        expect(a?.btradeAnalog).toBe("BT-1");
        expect(b?.btradeAnalog).toBe("");
    });
});

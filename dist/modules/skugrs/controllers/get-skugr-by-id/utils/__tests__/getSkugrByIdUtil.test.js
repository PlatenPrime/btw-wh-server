import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { Sku } from "../../../../../skus/models/Sku.js";
import { Skugr } from "../../../../models/Skugr.js";
import { getSkugrByIdUtil } from "../getSkugrByIdUtil.js";
describe("getSkugrByIdUtil", () => {
    beforeEach(async () => {
        await Skugr.deleteMany({});
        await Sku.deleteMany({});
    });
    it("returns null when skugr not found", async () => {
        const result = await getSkugrByIdUtil(new mongoose.Types.ObjectId().toString());
        expect(result).toBeNull();
    });
    it("returns dto without skus field", async () => {
        const sku = await Sku.create({
            konkName: "k1",
            prodName: "p1",
            productId: "k1-util",
            title: "S",
            url: "https://k1.com/util",
        });
        const skugr = await Skugr.create({
            konkName: "k1",
            prodName: "p1",
            title: "Util group",
            url: "https://k1.com/g-util",
            skus: [sku._id],
        });
        const result = await getSkugrByIdUtil(skugr._id.toString());
        expect(result).not.toBeNull();
        expect(result.title).toBe("Util group");
        expect(result).not.toHaveProperty("skus");
    });
});

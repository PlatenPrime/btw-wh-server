import { beforeEach, describe, expect, it } from "vitest";
import { Sku } from "../../../../../skus/models/Sku.js";
import { Skugr } from "../../../../models/Skugr.js";
import { clearSkugrSkusUtil } from "../clearSkugrSkusUtil.js";
describe("clearSkugrSkusUtil", () => {
    beforeEach(async () => {
        await Sku.deleteMany({});
        await Skugr.deleteMany({});
    });
    it("returns null when skugr missing", async () => {
        expect(await clearSkugrSkusUtil("507f1f77bcf86cd799439011")).toBeNull();
    });
    it("clears skus array but keeps sku documents", async () => {
        const sku = await Sku.create({
            konkName: "kc",
            prodName: "pc",
            productId: "kc-1",
            title: "S",
            url: "https://kc.com/1",
        });
        const g = await Skugr.create({
            konkName: "kc",
            prodName: "pc",
            title: "G",
            url: "https://kc.com/g",
            skus: [sku._id],
        });
        const updated = await clearSkugrSkusUtil(g._id.toString());
        expect(updated?.skus).toHaveLength(0);
        expect(await Sku.findById(sku._id)).not.toBeNull();
    });
});

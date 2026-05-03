import { beforeEach, describe, expect, it } from "vitest";
import { Skugr } from "../../../../../skugrs/models/Skugr.js";
import { Sku } from "../../../../models/Sku.js";
import { deleteSkusNotInAnySkugrQuerySchema } from "../../schemas/deleteSkusNotInAnySkugrQuerySchema.js";
import { deleteSkusNotInAnySkugrUtil } from "../deleteSkusNotInAnySkugrUtil.js";
describe("deleteSkusNotInAnySkugrUtil", () => {
    beforeEach(async () => {
        await Sku.deleteMany({});
        await Skugr.deleteMany({});
    });
    it("deletes only skus not in any skugr", async () => {
        const linked = await Sku.create({
            konkName: "kd",
            prodName: "pd",
            productId: "kd-l",
            title: "Linked",
            url: "https://kd.com/l",
        });
        await Sku.create({
            konkName: "kd",
            prodName: "pd",
            productId: "kd-o",
            title: "Orphan",
            url: "https://kd.com/o",
        });
        await Skugr.create({
            konkName: "kd",
            prodName: "pd",
            title: "G",
            url: "https://kd.com/g",
            skus: [linked._id],
        });
        const { deletedCount } = await deleteSkusNotInAnySkugrUtil(deleteSkusNotInAnySkugrQuerySchema.parse({}));
        expect(deletedCount).toBe(1);
        expect(await Sku.findById(linked._id)).not.toBeNull();
        expect(await Sku.countDocuments({ productId: "kd-o" })).toBe(0);
    });
    it("respects konkName when deleting orphans", async () => {
        await Sku.create({
            konkName: "k1",
            prodName: "p",
            productId: "k1-o",
            title: "O1",
            url: "https://k1.com/o",
        });
        await Sku.create({
            konkName: "k2",
            prodName: "p",
            productId: "k2-o",
            title: "O2",
            url: "https://k2.com/o",
        });
        const { deletedCount } = await deleteSkusNotInAnySkugrUtil(deleteSkusNotInAnySkugrQuerySchema.parse({ konkName: "k1" }));
        expect(deletedCount).toBe(1);
        expect(await Sku.countDocuments({ konkName: "k2" })).toBe(1);
    });
});

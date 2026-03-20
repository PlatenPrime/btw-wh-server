import { beforeEach, describe, expect, it } from "vitest";
import { Sku } from "../../../../models/Sku.js";
import { updateSkuByIdUtil } from "../updateSkuByIdUtil.js";
describe("updateSkuByIdUtil", () => {
    beforeEach(async () => {
        await Sku.deleteMany({});
    });
    it("returns null when sku not found", async () => {
        const result = await updateSkuByIdUtil({
            id: "000000000000000000000000",
            title: "New title",
        });
        expect(result).toBeNull();
    });
    it("updates only provided fields", async () => {
        const sku = await Sku.create({
            konkName: "k1",
            prodName: "p1",
            title: "Old",
            url: "https://k1.com/old",
        });
        const result = await updateSkuByIdUtil({
            id: sku._id.toString(),
            title: "New",
        });
        expect(result?.title).toBe("New");
        expect(result?.konkName).toBe("k1");
        expect(result?.prodName).toBe("p1");
    });
});

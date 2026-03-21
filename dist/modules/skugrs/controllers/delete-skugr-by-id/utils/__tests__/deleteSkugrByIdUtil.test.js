import { beforeEach, describe, expect, it } from "vitest";
import { Skugr } from "../../../../models/Skugr.js";
import { deleteSkugrByIdUtil } from "../deleteSkugrByIdUtil.js";
describe("deleteSkugrByIdUtil", () => {
    beforeEach(async () => {
        await Skugr.deleteMany({});
    });
    it("returns null when not found", async () => {
        const result = await deleteSkugrByIdUtil("507f1f77bcf86cd799439011");
        expect(result).toBeNull();
    });
    it("deletes and returns document", async () => {
        const created = await Skugr.create({
            konkName: "k",
            prodName: "p",
            title: "T",
            url: "https://k.com/t",
            skus: [],
        });
        const result = await deleteSkugrByIdUtil(created._id.toString());
        expect(result).not.toBeNull();
        const again = await Skugr.findById(created._id);
        expect(again).toBeNull();
    });
});

import { beforeEach, describe, expect, it } from "vitest";
import { Sku } from "../../../skus/models/Sku.js";
import { Skugr } from "../Skugr.js";
describe("Skugr Model", () => {
    beforeEach(async () => {
        await Skugr.deleteMany({});
        await Sku.deleteMany({});
    });
    it("fails without required fields", async () => {
        const doc = new Skugr({ title: "Only title" });
        await expect(doc.save()).rejects.toThrow();
    });
    it("saves with empty skus array", async () => {
        const saved = await Skugr.create({
            konkName: "k1",
            prodName: "p1",
            title: "Group A",
            url: "https://k1.com/group-a",
            skus: [],
        });
        expect(saved.skus).toHaveLength(0);
    });
    it("saves with sku references", async () => {
        const sku = await Sku.create({
            konkName: "k1",
            prodName: "p1",
            title: "Item",
            url: "https://k1.com/item",
        });
        const saved = await Skugr.create({
            konkName: "k1",
            prodName: "p1",
            title: "Group B",
            url: "https://k1.com/group-b",
            skus: [sku._id],
        });
        expect(saved.skus.map((id) => id.toString())).toEqual([sku._id.toString()]);
    });
});

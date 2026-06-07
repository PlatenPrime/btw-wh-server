import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { Skugr } from "../../../skugrs/models/Skugr.js";
import { Sku } from "../../models/Sku.js";
import { loadSkuIdsReferencedByAnySkugr } from "../loadSkuIdsReferencedByAnySkugr.js";
describe("loadSkuIdsReferencedByAnySkugr", () => {
    beforeEach(async () => {
        await Sku.deleteMany({});
        await Skugr.deleteMany({});
    });
    it("returns empty array when no skugrs", async () => {
        const ids = await loadSkuIdsReferencedByAnySkugr();
        expect(ids).toEqual([]);
    });
    it("returns distinct sku ids referenced by skugrs", async () => {
        const sku1 = await Sku.create({
            konkName: "k1",
            prodName: "p1",
            productId: "k1-a",
            title: "A",
            url: "https://k1.com/a",
        });
        const sku2 = await Sku.create({
            konkName: "k1",
            prodName: "p1",
            productId: "k1-b",
            title: "B",
            url: "https://k1.com/b",
        });
        await Skugr.create({
            konkName: "k1",
            prodName: "p1",
            title: "G1",
            url: "https://k1.com/g1",
            skus: [sku1._id, sku2._id],
        });
        await Skugr.create({
            konkName: "k1",
            prodName: "p1",
            title: "G2",
            url: "https://k1.com/g2",
            skus: [sku1._id],
        });
        const ids = await loadSkuIdsReferencedByAnySkugr();
        expect(ids).toHaveLength(2);
        const asStrings = ids.map((id) => id.toString()).sort();
        expect(asStrings).toEqual([sku1._id.toString(), sku2._id.toString()].sort());
    });
    it("normalizes string ids from distinct", async () => {
        const oid = new mongoose.Types.ObjectId();
        await Skugr.collection.insertOne({
            konkName: "k1",
            prodName: "p1",
            title: "Raw",
            url: "https://k1.com/raw",
            isSliced: true,
            skus: [oid.toString()],
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        const ids = await loadSkuIdsReferencedByAnySkugr();
        expect(ids).toHaveLength(1);
        expect(ids[0].toString()).toBe(oid.toString());
    });
});

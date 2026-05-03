import { beforeEach, describe, expect, it } from "vitest";
import { Sku } from "../../../../../skus/models/Sku.js";
import { Skugr } from "../../../../models/Skugr.js";
import { deleteSkugrWithSkusUtil } from "../deleteSkugrWithSkusUtil.js";
describe("deleteSkugrWithSkusUtil", () => {
    beforeEach(async () => {
        await Sku.deleteMany({});
        await Skugr.deleteMany({});
    });
    it("returns null when skugr missing", async () => {
        expect(await deleteSkugrWithSkusUtil("507f1f77bcf86cd799439011")).toBeNull();
    });
    it("deletes target skugr, deletes skus, pulls ids from other skugrs", async () => {
        const shared = await Sku.create({
            konkName: "kx",
            prodName: "px",
            productId: "kx-sh",
            title: "Shared",
            url: "https://kx.com/sh",
        });
        const onlyTarget = await Sku.create({
            konkName: "kx",
            prodName: "px",
            productId: "kx-only",
            title: "Only",
            url: "https://kx.com/only",
        });
        const target = await Skugr.create({
            konkName: "kx",
            prodName: "px",
            title: "Target",
            url: "https://kx.com/t",
            skus: [shared._id, onlyTarget._id],
        });
        const other = await Skugr.create({
            konkName: "kx",
            prodName: "px",
            title: "Other",
            url: "https://kx.com/o",
            skus: [shared._id],
        });
        const stats = await deleteSkugrWithSkusUtil(target._id.toString());
        expect(stats).not.toBeNull();
        expect(stats.deletedSkusCount).toBe(2);
        expect(stats.modifiedSkugrsCount).toBe(1);
        expect(await Skugr.findById(target._id)).toBeNull();
        expect(await Sku.findById(shared._id)).toBeNull();
        expect(await Sku.findById(onlyTarget._id)).toBeNull();
        const otherLean = await Skugr.findById(other._id).lean();
        expect(otherLean?.skus).toHaveLength(0);
    });
    it("deletes empty skugr without touching skus collection", async () => {
        const empty = await Skugr.create({
            konkName: "ke",
            prodName: "pe",
            title: "E",
            url: "https://ke.com/e",
            skus: [],
        });
        const stats = await deleteSkugrWithSkusUtil(empty._id.toString());
        expect(stats.deletedSkusCount).toBe(0);
        expect(stats.modifiedSkugrsCount).toBe(0);
        expect(await Skugr.findById(empty._id)).toBeNull();
    });
});

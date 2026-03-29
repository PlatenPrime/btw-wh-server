import { beforeEach, describe, expect, it } from "vitest";
import { Skugr } from "../../../../../skugrs/models/Skugr.js";
import { Sku } from "../../../../models/Sku.js";
import { getSkusBySkugrIdUtil } from "../getSkusBySkugrIdUtil.js";
const defaultQuery = { page: 1, limit: 10 };
describe("getSkusBySkugrIdUtil", () => {
    beforeEach(async () => {
        await Sku.deleteMany({});
        await Skugr.deleteMany({});
    });
    it("returns null when skugr does not exist", async () => {
        const fakeId = "507f1f77bcf86cd799439011";
        const result = await getSkusBySkugrIdUtil(fakeId, { ...defaultQuery });
        expect(result).toBeNull();
    });
    it("returns empty data when skugr has no skus", async () => {
        const skugr = await Skugr.create({
            konkName: "k",
            prodName: "p",
            title: "g",
            url: "https://k.com/g",
            skus: [],
        });
        const result = await getSkusBySkugrIdUtil(skugr._id.toString(), {
            ...defaultQuery,
        });
        expect(result).not.toBeNull();
        expect(result.skus).toHaveLength(0);
        expect(result.pagination.total).toBe(0);
    });
    it("returns only skus referenced by skugr", async () => {
        const inGroup = await Sku.create({
            konkName: "k1",
            prodName: "p1",
            productId: "k1-in",
            title: "In",
            url: "https://k1.com/in",
        });
        await Sku.create({
            konkName: "k1",
            prodName: "p1",
            productId: "k1-out",
            title: "Out",
            url: "https://k1.com/out",
        });
        const skugr = await Skugr.create({
            konkName: "k1",
            prodName: "p1",
            title: "grp",
            url: "https://k1.com/grp",
            skus: [inGroup._id],
        });
        const result = await getSkusBySkugrIdUtil(skugr._id.toString(), {
            ...defaultQuery,
        });
        expect(result.skus).toHaveLength(1);
        expect(result.skus[0].title).toBe("In");
        expect(result.pagination.total).toBe(1);
    });
    it("applies konkName, prodName and search within group skus", async () => {
        const wanted = await Sku.create({
            konkName: "kx",
            prodName: "px",
            productId: "kx-1",
            title: "Alpha Match",
            url: "https://kx.com/1",
        });
        const otherInGroup = await Sku.create({
            konkName: "kx",
            prodName: "px",
            productId: "kx-2",
            title: "Beta",
            url: "https://kx.com/2",
        });
        const skugr = await Skugr.create({
            konkName: "kx",
            prodName: "px",
            title: "grp",
            url: "https://kx.com/g",
            skus: [wanted._id, otherInGroup._id],
        });
        const result = await getSkusBySkugrIdUtil(skugr._id.toString(), {
            page: 1,
            limit: 10,
            konkName: "kx",
            prodName: "px",
            search: "alpha",
        });
        expect(result.skus).toHaveLength(1);
        expect(result.skus[0].title).toBe("Alpha Match");
    });
    it("paginates results", async () => {
        const s1 = await Sku.create({
            konkName: "k",
            prodName: "p",
            productId: "k-p-1",
            title: "S1",
            url: "https://k.com/1",
        });
        const s2 = await Sku.create({
            konkName: "k",
            prodName: "p",
            productId: "k-p-2",
            title: "S2",
            url: "https://k.com/2",
        });
        const skugr = await Skugr.create({
            konkName: "k",
            prodName: "p",
            title: "grp",
            url: "https://k.com/g",
            skus: [s1._id, s2._id],
        });
        const result = await getSkusBySkugrIdUtil(skugr._id.toString(), {
            page: 1,
            limit: 1,
        });
        expect(result.skus).toHaveLength(1);
        expect(result.pagination.total).toBe(2);
        expect(result.pagination.totalPages).toBe(2);
        expect(result.pagination.hasNext).toBe(true);
    });
});

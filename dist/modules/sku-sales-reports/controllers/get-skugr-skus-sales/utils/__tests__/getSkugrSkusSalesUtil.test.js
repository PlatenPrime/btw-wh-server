import { beforeEach, describe, expect, it } from "vitest";
import { Konk } from "../../../../../konks/models/Konk.js";
import { Sku } from "../../../../../skus/models/Sku.js";
import { Skugr } from "../../../../../skugrs/models/Skugr.js";
import { SkuSlice } from "../../../../../sku-slices/models/SkuSlice.js";
import { getSkugrSkusSalesUtil } from "../getSkugrSkusSalesUtil.js";
describe("getSkugrSkusSalesUtil", () => {
    beforeEach(async () => {
        await Konk.deleteMany({});
        await Sku.deleteMany({});
        await Skugr.deleteMany({});
        await SkuSlice.deleteMany({});
    });
    it("returns ok false when skugr missing", async () => {
        const result = await getSkugrSkusSalesUtil({
            skugrId: "507f1f77bcf86cd799439011",
            dateFrom: new Date("2026-08-01T00:00:00.000Z"),
            dateTo: new Date("2026-08-02T00:00:00.000Z"),
        });
        expect(result.ok).toBe(false);
    });
    it("returns empty data when skugr has no skus", async () => {
        const skugr = await Skugr.create({
            konkName: "sss-k",
            prodName: "sss-p",
            title: "Empty group",
            url: "https://e.com/g",
            isSliced: true,
            skus: [],
        });
        const result = await getSkugrSkusSalesUtil({
            skugrId: skugr._id.toString(),
            dateFrom: new Date("2026-08-10T00:00:00.000Z"),
            dateTo: new Date("2026-08-10T00:00:00.000Z"),
        });
        expect(result.ok).toBe(true);
        if (!result.ok)
            return;
        expect(result.skugrTitle).toBe("Empty group");
        expect(result.data).toEqual([]);
        expect(result.all).toEqual({
            title: "Усього",
            salesPcs: 0,
            salesUah: 0,
        });
    });
    it("aggregates per-sku sales and all equals sum of rows", async () => {
        const konk = "sss-konk";
        const prod = "sss-prod";
        const d0 = new Date("2026-09-01T00:00:00.000Z");
        const d1 = new Date("2026-09-02T00:00:00.000Z");
        const d2 = new Date("2026-09-03T00:00:00.000Z");
        const skuA = await Sku.create({
            konkName: konk,
            prodName: prod,
            productId: `${konk}-a`,
            title: "SKU A",
            url: "https://e.com/a",
            imageUrl: "https://cdn.example/a.webp",
        });
        const skuB = await Sku.create({
            konkName: konk,
            prodName: prod,
            productId: `${konk}-b`,
            title: "SKU B",
            url: "https://e.com/b",
        });
        const skugr = await Skugr.create({
            konkName: konk,
            prodName: prod,
            title: "Group",
            url: "https://e.com/g",
            isSliced: true,
            skus: [skuA._id, skuB._id],
        });
        await SkuSlice.insertMany([
            {
                konkName: konk,
                date: d0,
                data: {
                    [`${konk}-a`]: { stock: 10, price: 5 },
                    [`${konk}-b`]: { stock: 20, price: 2 },
                },
            },
            {
                konkName: konk,
                date: d1,
                data: {
                    [`${konk}-a`]: { stock: 7, price: 5 },
                    [`${konk}-b`]: { stock: 18, price: 2 },
                },
            },
            {
                konkName: konk,
                date: d2,
                data: {
                    [`${konk}-a`]: { stock: 5, price: 5 },
                    [`${konk}-b`]: { stock: 15, price: 2 },
                },
            },
        ]);
        const result = await getSkugrSkusSalesUtil({
            skugrId: skugr._id.toString(),
            dateFrom: d1,
            dateTo: d2,
        });
        expect(result.ok).toBe(true);
        if (!result.ok)
            return;
        expect(result.skugrTitle).toBe("Group");
        expect(result.data).toHaveLength(2);
        expect(result.data[0]).toMatchObject({
            skuId: skuA._id.toString(),
            title: "SKU A",
            productId: `${konk}-a`,
            imageUrl: "https://cdn.example/a.webp",
            salesPcs: 5,
            salesUah: 25,
        });
        expect(result.data[1]).toMatchObject({
            skuId: skuB._id.toString(),
            title: "SKU B",
            productId: `${konk}-b`,
            imageUrl: "",
            salesPcs: 5,
            salesUah: 10,
        });
        expect(result.all).toEqual({
            title: "Усього",
            salesPcs: 10,
            salesUah: 35,
        });
    });
    it("includes zero-sales sku rows and respects recountDays", async () => {
        const konk = "sss-recount";
        const prod = "sss-prod-r";
        const d0 = new Date("2026-04-01T00:00:00.000Z");
        const d1 = new Date("2026-04-02T00:00:00.000Z");
        const d2 = new Date("2026-04-03T00:00:00.000Z");
        await Konk.create({
            name: konk,
            title: "K",
            url: "https://example.com",
            imageUrl: "https://example.com/k.png",
            recountDays: ["2026-04-02"],
        });
        const skuFlat = await Sku.create({
            konkName: konk,
            prodName: prod,
            productId: `${konk}-flat`,
            title: "Flat",
            url: "https://e.com/flat",
        });
        const skuSold = await Sku.create({
            konkName: konk,
            prodName: prod,
            productId: `${konk}-sold`,
            title: "Sold",
            url: "https://e.com/sold",
        });
        const skugr = await Skugr.create({
            konkName: konk,
            prodName: prod,
            title: "Recount group",
            url: "https://e.com/g",
            isSliced: true,
            skus: [skuFlat._id, skuSold._id],
        });
        await SkuSlice.insertMany([
            {
                konkName: konk,
                date: d0,
                data: {
                    [`${konk}-flat`]: { stock: 10, price: 5 },
                    [`${konk}-sold`]: { stock: 10, price: 5 },
                },
            },
            {
                konkName: konk,
                date: d1,
                data: {
                    [`${konk}-flat`]: { stock: 10, price: 5 },
                    [`${konk}-sold`]: { stock: 7, price: 5 },
                },
            },
            {
                konkName: konk,
                date: d2,
                data: {
                    [`${konk}-flat`]: { stock: 10, price: 5 },
                    [`${konk}-sold`]: { stock: 5, price: 5 },
                },
            },
        ]);
        const result = await getSkugrSkusSalesUtil({
            skugrId: skugr._id.toString(),
            dateFrom: d1,
            dateTo: d2,
        });
        expect(result.ok).toBe(true);
        if (!result.ok)
            return;
        expect(result.skugrTitle).toBe("Recount group");
        expect(result.data[0]).toMatchObject({
            skuId: skuFlat._id.toString(),
            salesPcs: 0,
            salesUah: 0,
        });
        // recount day zeros sales; day2: sales 2 → revenue 10
        expect(result.data[1]).toMatchObject({
            skuId: skuSold._id.toString(),
            salesPcs: 2,
            salesUah: 10,
        });
        expect(result.all).toEqual({
            title: "Усього",
            salesPcs: 2,
            salesUah: 10,
        });
    });
});

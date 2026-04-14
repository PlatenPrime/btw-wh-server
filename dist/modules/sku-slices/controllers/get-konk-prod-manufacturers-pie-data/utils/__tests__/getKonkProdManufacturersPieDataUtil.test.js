import { beforeEach, describe, expect, it } from "vitest";
import { Prod } from "../../../../../prods/models/Prod.js";
import { Sku } from "../../../../../skus/models/Sku.js";
import { SkuSlice } from "../../../../models/SkuSlice.js";
import { getKonkProdManufacturersPieDataUtil } from "../getKonkProdManufacturersPieDataUtil.js";
describe("getKonkProdManufacturersPieDataUtil", () => {
    beforeEach(async () => {
        await Prod.deleteMany({});
        await Sku.deleteMany({});
        await SkuSlice.deleteMany({});
    });
    it("returns ok false when no sku for konk", async () => {
        const result = await getKonkProdManufacturersPieDataUtil({
            konk: "no-konk",
            dateFrom: new Date("2026-11-01T00:00:00.000Z"),
            dateTo: new Date("2026-11-02T00:00:00.000Z"),
        });
        expect(result.ok).toBe(false);
    });
    it("aggregates multiple sku rows of one manufacturer", async () => {
        const konk = "pie-konk-1";
        const prod = "Acme";
        const d0 = new Date("2026-11-09T00:00:00.000Z");
        const d1 = new Date("2026-11-10T00:00:00.000Z");
        const d2 = new Date("2026-11-11T00:00:00.000Z");
        await Sku.insertMany([
            {
                konkName: konk,
                prodName: prod,
                productId: `${konk}-a`,
                title: "A",
                url: "https://e.com/pie-a",
            },
            {
                konkName: konk,
                prodName: prod,
                productId: `${konk}-b`,
                title: "B",
                url: "https://e.com/pie-b",
            },
        ]);
        await Prod.create({
            name: prod,
            title: "ACME Extended Title",
            imageUrl: "https://e.com/prod-acme.png",
        });
        await SkuSlice.insertMany([
            {
                konkName: konk,
                date: d0,
                data: {
                    [`${konk}-a`]: { stock: 12, price: 10 },
                    [`${konk}-b`]: { stock: 8, price: 20 },
                },
            },
            {
                konkName: konk,
                date: d1,
                data: {
                    [`${konk}-a`]: { stock: 10, price: 10 },
                    [`${konk}-b`]: { stock: 7, price: 20 },
                },
            },
            {
                konkName: konk,
                date: d2,
                data: {
                    [`${konk}-a`]: { stock: 9, price: 10 },
                    [`${konk}-b`]: { stock: 5, price: 20 },
                },
            },
        ]);
        const result = await getKonkProdManufacturersPieDataUtil({
            konk,
            dateFrom: d1,
            dateTo: d2,
        });
        expect(result.ok).toBe(true);
        if (!result.ok)
            return;
        expect(result.data[prod]).toEqual({
            title: "ACME Extended Title",
            salesPcs: 6, // A:2+1, B:1+2
            salesUah: 90, // A:20+10, B:20+40
        });
        expect(result.all).toEqual({
            title: "Всі виробники",
            salesPcs: 6,
            salesUah: 90,
        });
    });
    it("returns map grouped by different manufacturers", async () => {
        const konk = "pie-konk-2";
        const d0 = new Date("2026-12-01T00:00:00.000Z");
        const d1 = new Date("2026-12-02T00:00:00.000Z");
        await Sku.insertMany([
            {
                konkName: konk,
                prodName: "Maker A",
                productId: `${konk}-a`,
                title: "A",
                url: "https://e.com/pie2-a",
            },
            {
                konkName: konk,
                prodName: "Maker B",
                productId: `${konk}-b`,
                title: "B",
                url: "https://e.com/pie2-b",
            },
        ]);
        await SkuSlice.insertMany([
            {
                konkName: konk,
                date: d0,
                data: {
                    [`${konk}-a`]: { stock: 6, price: 5 },
                    [`${konk}-b`]: { stock: 9, price: 4 },
                },
            },
            {
                konkName: konk,
                date: d1,
                data: {
                    [`${konk}-a`]: { stock: 4, price: 5 },
                    [`${konk}-b`]: { stock: 8, price: 4 },
                },
            },
        ]);
        const result = await getKonkProdManufacturersPieDataUtil({
            konk,
            dateFrom: d1,
            dateTo: d1,
        });
        expect(result.ok).toBe(true);
        if (!result.ok)
            return;
        expect(Object.keys(result.data).sort()).toEqual(["Maker A", "Maker B"]);
        expect(result.data["Maker A"]).toMatchObject({ salesPcs: 2, salesUah: 10 });
        expect(result.data["Maker B"]).toMatchObject({ salesPcs: 1, salesUah: 4 });
        expect(result.all).toEqual({
            title: "Всі виробники",
            salesPcs: 3,
            salesUah: 14,
        });
    });
    it("normalizes -1 and missing values via carry before sales calculation", async () => {
        const konk = "pie-konk-3";
        const prod = "Carry Maker";
        const d0 = new Date("2026-12-09T00:00:00.000Z");
        const d1 = new Date("2026-12-10T00:00:00.000Z");
        const d2 = new Date("2026-12-11T00:00:00.000Z");
        await Sku.create({
            konkName: konk,
            prodName: prod,
            productId: `${konk}-x`,
            title: "X",
            url: "https://e.com/pie3-x",
        });
        await SkuSlice.insertMany([
            {
                konkName: konk,
                date: d0,
                data: {
                    [`${konk}-x`]: { stock: 10, price: 5 },
                },
            },
            {
                konkName: konk,
                date: d1,
                data: {
                    [`${konk}-x`]: { stock: -1, price: -1 },
                },
            },
            {
                konkName: konk,
                date: d2,
                data: {
                    [`${konk}-x`]: { stock: 6, price: 4 },
                },
            },
        ]);
        const result = await getKonkProdManufacturersPieDataUtil({
            konk,
            dateFrom: d1,
            dateTo: d2,
        });
        expect(result.ok).toBe(true);
        if (!result.ok)
            return;
        // d1 carries 10/5, d2 stock drops 10->6 => sales 4 with day price 4
        expect(result.data[prod]).toEqual({
            title: prod,
            salesPcs: 4,
            salesUah: 16,
        });
        expect(result.all).toEqual({
            title: "Всі виробники",
            salesPcs: 4,
            salesUah: 16,
        });
    });
    it("falls back to prodName when Prod record is missing", async () => {
        const konk = "pie-konk-4";
        const prod = "No Prod In Collection";
        const d0 = new Date("2026-12-19T00:00:00.000Z");
        const d1 = new Date("2026-12-20T00:00:00.000Z");
        await Sku.create({
            konkName: konk,
            prodName: prod,
            productId: `${konk}-fallback`,
            title: "Fallback SKU",
            url: "https://e.com/pie4-x",
        });
        await SkuSlice.insertMany([
            {
                konkName: konk,
                date: d0,
                data: {
                    [`${konk}-fallback`]: { stock: 5, price: 2 },
                },
            },
            {
                konkName: konk,
                date: d1,
                data: {
                    [`${konk}-fallback`]: { stock: 3, price: 2 },
                },
            },
        ]);
        const result = await getKonkProdManufacturersPieDataUtil({
            konk,
            dateFrom: d1,
            dateTo: d1,
        });
        expect(result.ok).toBe(true);
        if (!result.ok)
            return;
        expect(result.data[prod]).toEqual({
            title: prod,
            salesPcs: 2,
            salesUah: 4,
        });
        expect(result.all).toEqual({
            title: "Всі виробники",
            salesPcs: 2,
            salesUah: 4,
        });
    });
});

import { beforeEach, describe, expect, it } from "vitest";
import { Art } from "../../../../../arts/models/Art.js";
import { BtradeSlice } from "../../../../../btrade-slices/models/BtradeSlice.js";
import { Sku } from "../../../../../skus/models/Sku.js";
import { SkuSlice } from "../../../../models/SkuSlice.js";
import { getKonkProdSkuSalesChartDataUtil } from "../getKonkProdSkuSalesChartDataUtil.js";
describe("getKonkProdSkuSalesChartDataUtil", () => {
    beforeEach(async () => {
        await Sku.deleteMany({});
        await SkuSlice.deleteMany({});
        await BtradeSlice.deleteMany({});
        await Art.deleteMany({});
    });
    it("sums competitor sales across skus and btrade sales across all Art artikuls for prod", async () => {
        const konk = "ks-k";
        const prod = "ks-p";
        const btA = "KS-BT-A";
        const btB = "KS-BT-B";
        await Sku.insertMany([
            {
                konkName: konk,
                prodName: prod,
                productId: `${konk}-a`,
                title: "A",
                url: "https://e.com/ks-a",
            },
            {
                konkName: konk,
                prodName: prod,
                productId: `${konk}-b`,
                title: "B",
                url: "https://e.com/ks-b",
            },
        ]);
        await Art.insertMany([
            { artikul: btA, prodName: prod, zone: "Z1" },
            { artikul: btB, prodName: prod, zone: "Z2" },
        ]);
        const d1 = new Date("2026-09-01T00:00:00.000Z");
        const d2 = new Date("2026-09-02T00:00:00.000Z");
        await SkuSlice.insertMany([
            {
                konkName: konk,
                date: d1,
                data: {
                    [`${konk}-a`]: { stock: 10, price: 2 },
                    [`${konk}-b`]: { stock: 4, price: 3 },
                },
            },
            {
                konkName: konk,
                date: d2,
                data: {
                    [`${konk}-a`]: { stock: 7, price: 2 },
                    [`${konk}-b`]: { stock: 2, price: 3 },
                },
            },
        ]);
        await BtradeSlice.insertMany([
            {
                date: d1,
                data: {
                    [btA]: { quantity: 40, price: 10 },
                    [btB]: { quantity: 20, price: 11 },
                },
            },
            {
                date: d2,
                data: {
                    [btA]: { quantity: 35, price: 10 },
                    [btB]: { quantity: 18, price: 11 },
                },
            },
        ]);
        const r = await getKonkProdSkuSalesChartDataUtil({
            konk,
            prod,
            dateFrom: d1,
            dateTo: d2,
        });
        expect(r.ok).toBe(true);
        if (!r.ok)
            return;
        expect(r.data.days[0]).toMatchObject({
            competitorSales: 0,
            btradeSales: 0,
        });
        expect(r.data.days[1]).toMatchObject({
            competitorSales: 5,
            btradeSales: 7,
        });
        expect(r.data.summary.totalCompetitorSales).toBe(5);
        expect(r.data.summary.totalBtradeSales).toBe(7);
    });
});

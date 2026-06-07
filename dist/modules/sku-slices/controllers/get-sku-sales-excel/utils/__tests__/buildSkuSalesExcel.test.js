import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { buildSkuSalesExcelForSkus, computeSkuSalesPeriodMetrics, } from "../buildSkuSalesExcel.js";
const SKU = {
    title: "Item",
    url: "https://e.com/i",
    productId: "air-1",
    konkName: "air",
    competitorTitle: "Air UA",
    producerName: "Maker",
    skugrTitle: "Group",
};
describe("computeSkuSalesPeriodMetrics", () => {
    it("computes sales and revenue from stock sequence", () => {
        const from = new Date("2026-01-10T00:00:00.000Z");
        const to = new Date("2026-01-11T00:00:00.000Z");
        const metrics = computeSkuSalesPeriodMetrics(SKU, from, to, (_kn, pid, d) => {
            if (pid !== "air-1")
                return undefined;
            const t = d.getTime();
            if (t === new Date("2026-01-09T00:00:00.000Z").getTime())
                return { stock: 5, price: 10 };
            if (t === from.getTime())
                return { stock: 3, price: 10 };
            if (t === to.getTime())
                return { stock: 1, price: 12 };
            return undefined;
        });
        expect(metrics.salesByDay).toEqual([2, 2]);
        expect(metrics.revenueByDay).toEqual([20, 24]);
        expect(metrics.totalSales).toBe(4);
        expect(metrics.totalRevenue).toBe(44);
    });
});
describe("buildSkuSalesExcelForSkus", () => {
    it("produces non-empty xlsx buffer for one sku", async () => {
        const from = new Date("2026-01-10T00:00:00.000Z");
        const to = new Date("2026-01-11T00:00:00.000Z");
        const { buffer } = await buildSkuSalesExcelForSkus([SKU], from, to, (_kn, pid, d) => {
            if (pid !== "air-1")
                return undefined;
            const t = d.getTime();
            if (t === new Date("2026-01-09T00:00:00.000Z").getTime())
                return { stock: 4, price: 5 };
            if (t === from.getTime())
                return { stock: 2, price: 5 };
            if (t === to.getTime())
                return { stock: 1, price: 6 };
            return undefined;
        });
        expect(Buffer.isBuffer(buffer)).toBe(true);
        expect(buffer.length).toBeGreaterThan(100);
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);
        const sheet = workbook.getWorksheet("Продажі");
        expect(sheet).toBeDefined();
        expect(sheet.getRow(1).getCell(1).value).toBe("Ідентифікатор товару");
    });
});

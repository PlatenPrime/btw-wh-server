import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { buildSalesComparisonExcelBlock, buildSalesComparisonSummaryBlock, setupSalesComparisonHeaderRow, } from "../buildSalesComparisonExcelBlock.js";
describe("buildSalesComparisonExcelBlock", () => {
    const items = [
        {
            date: new Date("2026-03-01T00:00:00.000Z"),
            analogStock: 100,
            analogPrice: 10,
            btradeStock: 200,
            btradePrice: 12,
        },
        {
            date: new Date("2026-03-02T00:00:00.000Z"),
            analogStock: 90,
            analogPrice: 10,
            btradeStock: 185,
            btradePrice: 12,
        },
    ];
    const dataStartCol = 7;
    const totalCol = 9;
    const diffSalesCol = 10;
    const diffSalesPctCol = 11;
    const diffRevenueCol = 12;
    const diffRevenuePctCol = 13;
    const columnCount = 13;
    function createWorksheet() {
        const workbook = new ExcelJS.Workbook();
        return workbook.addWorksheet("Test");
    }
    it("setupSalesComparisonHeaderRow writes sales comparison headers", () => {
        const worksheet = createWorksheet();
        setupSalesComparisonHeaderRow({
            worksheet,
            items,
            dataStartCol,
            totalCol,
            diffSalesCol,
            diffSalesPctCol,
            diffRevenueCol,
            diffRevenuePctCol,
            columnCount,
        });
        const headerRow = worksheet.getRow(1);
        expect(headerRow.getCell(1).value).toBe("Артикул");
        expect(headerRow.getCell(totalCol).value).toBe("Всього");
        expect(headerRow.getCell(diffSalesCol).value).toBe("Δ Продажі Btrade vs конкурент, шт");
    });
    it("buildSalesComparisonExcelBlock computes sales totals and deltas", () => {
        const worksheet = createWorksheet();
        const totals = buildSalesComparisonExcelBlock({
            worksheet,
            startRow: 2,
            dataStartCol,
            totalCol,
            diffSalesCol,
            diffSalesPctCol,
            diffRevenueCol,
            diffRevenuePctCol,
            columnCount,
            items,
            artikul: "1102-0259",
            artNameUkr: "Тестовий товар",
            artAbc: "A",
            producerName: "Producer",
            competitorTitle: "Air",
            previousAnalogStock: 110,
            previousBtradeStock: 210,
        });
        expect(totals.totalAnalogSales).toBe(20);
        expect(totals.totalBtradeSales).toBe(25);
        expect(totals.totalAnalogRevenue).toBe(200);
        expect(totals.totalBtradeRevenue).toBe(300);
        const salesRow = worksheet.getRow(2);
        expect(salesRow.getCell(1).value).toBe("1102-0259");
        expect(salesRow.getCell(6).value).toBe("Продажі аналога");
        expect(salesRow.getCell(totalCol).value).toBe(20);
        expect(salesRow.getCell(diffSalesCol).value).toBe(5);
    });
    it("buildSalesComparisonSummaryBlock writes key-value summary", () => {
        const worksheet = createWorksheet();
        buildSalesComparisonSummaryBlock({
            worksheet,
            startRow: 10,
            keyCol: 1,
            valueCol: 2,
            totalAnalogSales: 20,
            totalAnalogRevenue: 200,
            totalBtradeSales: 25,
            totalBtradeRevenue: 300,
        });
        expect(worksheet.getRow(10).getCell(1).value).toBe("Продажі конкурента (всього)");
        expect(worksheet.getRow(10).getCell(2).value).toBe(20);
        expect(worksheet.getRow(14).getCell(1).value).toBe("Δ Продажі, шт");
        expect(worksheet.getRow(14).getCell(2).value).toBe(5);
    });
});

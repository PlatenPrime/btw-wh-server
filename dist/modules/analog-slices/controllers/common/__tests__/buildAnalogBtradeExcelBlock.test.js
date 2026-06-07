import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { buildAnalogBtradeExcelBlock, buildAnalogBtradeTotalBlock, setupAnalogBtradeHeaderRow, } from "../buildAnalogBtradeExcelBlock.js";
describe("buildAnalogBtradeExcelBlock", () => {
    const items = [
        {
            date: new Date("2026-03-01T00:00:00.000Z"),
            analogStock: 1,
            analogPrice: 1.5,
            btradeStock: 10,
            btradePrice: 2.0,
        },
        {
            date: new Date("2026-03-02T00:00:00.000Z"),
            analogStock: 2,
            analogPrice: 1.6,
            btradeStock: 20,
            btradePrice: 2.1,
        },
    ];
    const dataStartCol = 7;
    const diffCol = 9;
    const diffPctCol = 10;
    const summaryDiffCol = 11;
    const summaryDiffPctCol = 12;
    const columnCount = 12;
    function createWorksheet() {
        const workbook = new ExcelJS.Workbook();
        return workbook.addWorksheet("Test");
    }
    it("setupAnalogBtradeHeaderRow writes Ukrainian headers", () => {
        const worksheet = createWorksheet();
        setupAnalogBtradeHeaderRow(worksheet, items, dataStartCol, diffCol, diffPctCol, summaryDiffCol, summaryDiffPctCol, columnCount);
        const headerRow = worksheet.getRow(1);
        expect(headerRow.getCell(1).value).toBe("Артикул");
        expect(headerRow.getCell(2).value).toBe("Назва (укр)");
        expect(headerRow.getCell(diffCol).value).toBe("Різниця");
        expect(headerRow.getCell(summaryDiffCol).value).toBe("Δ Btrade vs конкурент, шт");
    });
    it("buildAnalogBtradeExcelBlock writes 4 data rows and computes deltas", () => {
        const worksheet = createWorksheet();
        const deltas = buildAnalogBtradeExcelBlock({
            worksheet,
            startRow: 2,
            dataStartCol,
            diffCol,
            diffPctCol,
            summaryDiffCol,
            summaryDiffPctCol,
            columnCount,
            items,
            artikul: "1102-0259",
            artNameUkr: "Тестовий товар",
            artAbc: "A",
            producerName: "Producer",
            competitorTitle: "Air",
        });
        expect(deltas).toEqual({ deltaAnalog: 1, deltaBtrade: 10 });
        const stockRow = worksheet.getRow(2);
        expect(stockRow.getCell(1).value).toBe("1102-0259");
        expect(stockRow.getCell(6).value).toBe("Залишок аналога");
        expect(stockRow.getCell(7).value).toBe(1);
        expect(stockRow.getCell(8).value).toBe(2);
        expect(stockRow.getCell(diffCol).value).toBe(1);
        expect(stockRow.getCell(summaryDiffCol).value).toBe(-9);
    });
    it("buildAnalogBtradeTotalBlock writes totals row", () => {
        const worksheet = createWorksheet();
        buildAnalogBtradeTotalBlock({
            worksheet,
            totalStartRow: 6,
            diffCol,
            summaryDiffCol,
            summaryDiffPctCol,
            columnCount,
            sumDeltaAnalog: 5,
            sumDeltaBtrade: 15,
            competitorTitle: "Air",
            producerName: "Producer",
        });
        const row1 = worksheet.getRow(6);
        expect(row1.getCell(1).value).toBe("ВСЬОГО");
        expect(row1.getCell(diffCol).value).toBe(5);
        expect(row1.getCell(summaryDiffCol).value).toBe(-10);
    });
});

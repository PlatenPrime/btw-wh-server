import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { formatExcelDateHeaderUk } from "../../../../../../lib/excel/formatExcelDateHeaderUk.js";
import { buildAnalogSalesComparisonExcel } from "../buildAnalogSalesComparisonExcel.js";
async function readSheetToMatrix(buffer) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.getWorksheet("Порівняння");
    if (!worksheet)
        return [];
    const rows = [];
    const rowCount = worksheet.rowCount ?? 0;
    for (let r = 1; r <= rowCount; r++) {
        const row = worksheet.getRow(r);
        const cols = [];
        row.eachCell({ includeEmpty: true }, (cell) => {
            cols.push(cell.value ?? null);
        });
        rows.push(cols);
    }
    return rows;
}
describe("buildAnalogSalesComparisonExcel", () => {
    it("builds excel with sales comparison headers and summary", async () => {
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
        const { buffer, fileName } = await buildAnalogSalesComparisonExcel(items, {
            artikul: "1102-0259",
            artNameUkr: "Тестовий товар",
            producerName: "Test Producer",
            competitorTitle: "Air",
            dateFrom: new Date("2026-03-01T00:00:00.000Z"),
            dateTo: new Date("2026-03-02T00:00:00.000Z"),
        });
        expect(buffer).toBeInstanceOf(Buffer);
        expect(buffer.length).toBeGreaterThan(0);
        expect(fileName).toContain("analog_sales_comparison_1102-0259_2026-03-01_2026-03-02");
        const rows = await readSheetToMatrix(buffer);
        expect(rows.length).toBeGreaterThanOrEqual(9);
        const headerRow = rows[0];
        expect(headerRow[0]).toBe("Артикул");
        expect(headerRow[6]).toBe(formatExcelDateHeaderUk(new Date("2026-03-01T00:00:00.000Z")));
        expect(headerRow[8]).toBe("Всього");
        const dataRow = rows[1];
        expect(dataRow[1]).toBe("Тестовий товар");
        expect(dataRow[5]).toBe("Продажі аналога");
    });
    it("returns empty workbook when items array is empty", async () => {
        const { buffer, fileName } = await buildAnalogSalesComparisonExcel([], {
            artikul: "1102-0259",
            artNameUkr: null,
            dateFrom: new Date("2026-03-01T00:00:00.000Z"),
            dateTo: new Date("2026-03-02T00:00:00.000Z"),
        });
        expect(buffer).toBeInstanceOf(Buffer);
        expect(fileName).toContain("analog_sales_comparison_1102-0259");
    });
});

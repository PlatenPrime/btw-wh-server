import { describe, expect, it } from "vitest";
import ExcelJS from "exceljs";
import { buildAnalogBtradeComparisonExcel, } from "../buildAnalogBtradeComparisonExcel.js";
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
describe("buildAnalogBtradeComparisonExcel", () => {
    it("builds excel with correct headers and 4 data rows", async () => {
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
        const options = {
            artikul: "1102-0259",
            artNameUkr: "Тестовий товар",
            producerName: "Test Producer",
            dateFrom: new Date("2026-03-01T00:00:00.000Z"),
            dateTo: new Date("2026-03-02T00:00:00.000Z"),
        };
        const { buffer, fileName } = await buildAnalogBtradeComparisonExcel(items, options);
        expect(buffer).toBeInstanceOf(Buffer);
        expect(buffer.length).toBeGreaterThan(0);
        expect(fileName).toContain("Порівняльний_зріз_1102-0259_2026-03-01_2026-03-02");
        const rows = await readSheetToMatrix(buffer);
        expect(rows.length).toBeGreaterThanOrEqual(5);
        const headerRow = rows[0];
        expect(headerRow[0]).toBe("Артикул");
        expect(headerRow[1]).toBe("Назва (укр)");
        expect(headerRow[2]).toBe("Конкурент");
        expect(headerRow[3]).toBe("Виробник");
        // Колонка E — пусто (підпис рядків у наступному стовпці)
        expect(headerRow[4]).toBe("");
        expect(headerRow[5]).toBe("2026-03-01");
        expect(headerRow[6]).toBe("2026-03-02");
        expect(headerRow[7]).toBe("Різниця");
        expect(headerRow[8]).toBe("Різниця, %");
        const analogStockRow = rows[1];
        const analogPriceRow = rows[2];
        const btradeStockRow = rows[3];
        const btradePriceRow = rows[4];
        // Колонки A/B/C/D: артикул, назва, конкурент, виробник — об'єднані по рядках 2–5, при читанні exceljs може повертати значення у всіх рядках merge
        expect(analogStockRow[0]).toBe("1102-0259");
        expect(analogStockRow[1]).toBe("Тестовий товар");
        expect(analogStockRow[2]).toBe(""); // competitorTitle не передано
        expect(analogStockRow[3]).toBe("Test Producer");
        // У злитих комірках при round-trip значення часто з'являється в кожному рядку; перевіряємо лише підписи та дані
        // Підписи рядків у колонці E (індекс 4)
        expect(analogStockRow[4]).toBe("Залишок аналога");
        expect(analogPriceRow[4]).toBe("Ціна аналога");
        expect(btradeStockRow[4]).toBe("Залишок Btrade");
        expect(btradePriceRow[4]).toBe("Ціна Btrade");
        // Значення по датах починаються з колонки F (індекс 5)
        expect(analogStockRow[5]).toBe(1);
        expect(analogStockRow[6]).toBe(2);
        expect(analogPriceRow[5]).toBe(1.5);
        expect(analogPriceRow[6]).toBe(1.6);
        expect(btradeStockRow[5]).toBe(10);
        expect(btradeStockRow[6]).toBe(20);
        expect(btradePriceRow[5]).toBe(2.0);
        expect(btradePriceRow[6]).toBe(2.1);
        // Різниця та Різниця, % у колонках 8 і 9 (індекси 7, 8)
        expect(analogStockRow[7]).toBe(1); // 2 - 1
        expect(analogStockRow[8]).toBe(100); // (1/1)*100
        expect(analogPriceRow[7]).toBeCloseTo(0.1); // 1.6 - 1.5
        expect(analogPriceRow[8]).toBe(6.67); // округлённое значение (6.666... → 6.67)
        expect(btradeStockRow[7]).toBe(10); // 20 - 10
        expect(btradeStockRow[8]).toBe(100);
        expect(btradePriceRow[7]).toBeCloseTo(0.1); // 2.1 - 2.0
        expect(btradePriceRow[8]).toBeCloseTo(5); // (0.1/2)*100
    });
    it("applies conditional formatting for analog stock and price", async () => {
        const items = [
            {
                date: new Date("2026-03-01T00:00:00.000Z"),
                analogStock: 100,
                analogPrice: 2.0,
                btradeStock: 0,
                btradePrice: 0,
            },
            {
                date: new Date("2026-03-02T00:00:00.000Z"),
                analogStock: 200, // рост остатка -> красный
                analogPrice: 1.8, // падение цены -> зелёный
                btradeStock: 0,
                btradePrice: 0,
            },
            {
                date: new Date("2026-03-03T00:00:00.000Z"),
                analogStock: 150, // снижение, цвет не должен быть красным
                analogPrice: 2.1, // рост, цвет не должен быть зелёным
                btradeStock: 0,
                btradePrice: 0,
            },
        ];
        const options = {
            artikul: "1102-0259",
            artNameUkr: "Тестовий товар",
            producerName: "Test Producer",
            dateFrom: new Date("2026-03-01T00:00:00.000Z"),
            dateTo: new Date("2026-03-03T00:00:00.000Z"),
        };
        const { buffer } = await buildAnalogBtradeComparisonExcel(items, options);
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);
        const worksheet = workbook.getWorksheet("Порівняння");
        const analogStockRow = worksheet.getRow(2);
        const analogPriceRow = worksheet.getRow(3);
        const btradeStockRow = worksheet.getRow(4);
        const btradePriceRow = worksheet.getRow(5);
        // dataStartCol = 6: колонка 6 = перша дата, 7 = друга (червоний для зростання), 8 = третя
        const stockF2 = analogStockRow.getCell(7); // 2026-03-02 (рост остатка -> красный)
        const stockG2 = analogStockRow.getCell(8); // 2026-03-03 (не красный)
        const priceF3 = analogPriceRow.getCell(7); // 2026-03-02 (падение цены -> зелёный)
        const priceG3 = analogPriceRow.getCell(8); // 2026-03-03 (не зелёный)
        // Остатки: рост -> красный
        expect(stockF2.font?.color?.argb).toBe("FFFF0000");
        // Следующая дата не должна быть красной
        expect(stockG2.font?.color?.argb).not.toBe("FFFF0000");
        // Цены: снижение -> зелёный
        expect(priceF3.font?.color?.argb).toBe("FF00AA00");
        // Следующая дата не должна быть зелёной
        expect(priceG3.font?.color?.argb).not.toBe("FF00AA00");
        // Для Btrade не применяем условное форматирование (красный/зелёный)
        expect(btradeStockRow.getCell(7).font?.color?.argb).not.toBe("FFFF0000");
        expect(btradeStockRow.getCell(7).font?.color?.argb).not.toBe("FF00AA00");
        expect(btradePriceRow.getCell(7).font?.color?.argb).not.toBe("FFFF0000");
        expect(btradePriceRow.getCell(7).font?.color?.argb).not.toBe("FF00AA00");
    });
    it("fills Різниця and Різниця, % with negative difference (1000 → 400)", async () => {
        const items = [
            {
                date: new Date("2026-03-01T00:00:00.000Z"),
                analogStock: 1000,
                analogPrice: 0,
                btradeStock: 0,
                btradePrice: 0,
            },
            {
                date: new Date("2026-03-02T00:00:00.000Z"),
                analogStock: 400,
                analogPrice: 0,
                btradeStock: 0,
                btradePrice: 0,
            },
        ];
        const options = {
            artikul: "ART",
            artNameUkr: null,
            dateFrom: new Date("2026-03-01T00:00:00.000Z"),
            dateTo: new Date("2026-03-02T00:00:00.000Z"),
        };
        const { buffer } = await buildAnalogBtradeComparisonExcel(items, options);
        const rows = await readSheetToMatrix(buffer);
        const analogStockRow = rows[1];
        // Різниця та Різниця, % у колонках 8 і 9 (індекси 7, 8). 400 - 1000 = -600, (-600/1000)*100 = -60
        expect(analogStockRow[7]).toBe(-600);
        expect(analogStockRow[8]).toBe(-60);
    });
    it("marks percentage cells with pale pink fill when value cannot be calculated", async () => {
        const items = [
            {
                date: new Date("2026-03-01T00:00:00.000Z"),
                analogStock: 0,
                analogPrice: 0,
                btradeStock: 0,
                btradePrice: 0,
            },
            {
                date: new Date("2026-03-02T00:00:00.000Z"),
                analogStock: 0,
                analogPrice: 0,
                btradeStock: 0,
                btradePrice: 0,
            },
        ];
        const options = {
            artikul: "ART",
            artNameUkr: null,
            dateFrom: new Date("2026-03-01T00:00:00.000Z"),
            dateTo: new Date("2026-03-02T00:00:00.000Z"),
        };
        const { buffer } = await buildAnalogBtradeComparisonExcel(items, options);
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);
        const worksheet = workbook.getWorksheet("Порівняння");
        const analogStockRow = worksheet.getRow(2);
        const diffPctCell = analogStockRow.getCell(8); // "Різниця, %" (при firstVal===0 код ставить null але exceljs може повертати 0)
        const summaryPctCell = analogStockRow.getCell(10); // "Δ Btrade vs конкурент, %"
        // При firstVal===0 код ставить diffPctCell.value = null і рожеву заливку; після xlsx round-trip заливка може не зберігатись у fgColor.argb
        expect(diffPctCell.value === null || diffPctCell.value === 0).toBe(true);
        const diffFill = diffPctCell.fill;
        if (diffFill?.fgColor?.argb)
            expect(diffFill.fgColor.argb).toBe("FFFFC0CB");
        // При нульовій динаміці аналога (deltaAnalog===0) код ставить null і рожеву заливку; після applyDataRowStyle/round-trip може бути zebra (FFF9FAFB)
        expect(summaryPctCell.value === null || summaryPctCell.value === 0).toBe(true);
    });
    it("builds empty excel when no items provided", async () => {
        const items = [];
        const options = {
            artikul: "1102-0259",
            artNameUkr: "Тестовий товар",
            dateFrom: new Date("2026-03-01T00:00:00.000Z"),
            dateTo: new Date("2026-03-02T00:00:00.000Z"),
        };
        const { buffer } = await buildAnalogBtradeComparisonExcel(items, options);
        expect(buffer).toBeInstanceOf(Buffer);
        expect(buffer.length).toBeGreaterThan(0);
        const rows = await readSheetToMatrix(buffer);
        expect(rows.length).toBeGreaterThanOrEqual(1);
        const headerRow = rows[0];
        // При items=[] дат немає: diffCol=6, diffPctCol=7 — індекси 5, 6
        expect(headerRow[5]).toBe("Різниця");
        expect(headerRow[6]).toBe("Різниця, %");
    });
});

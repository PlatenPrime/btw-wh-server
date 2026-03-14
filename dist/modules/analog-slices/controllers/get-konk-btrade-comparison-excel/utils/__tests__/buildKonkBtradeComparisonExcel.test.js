import { describe, expect, it } from "vitest";
import ExcelJS from "exceljs";
import { buildKonkBtradeComparisonExcel, } from "../buildKonkBtradeComparisonExcel.js";
describe("buildKonkBtradeComparisonExcel", () => {
    it("builds excel with multiple analog blocks stacked", async () => {
        const date1 = new Date("2026-03-01T00:00:00.000Z");
        const date2 = new Date("2026-03-02T00:00:00.000Z");
        // передаём аналоги в «перемешанном» порядке, билдер должен отсортировать по артикулу
        const analogs = [
            {
                analogId: "a2",
                artikul: "1102-0260",
                artNameUkr: "Товар 2",
                artAbc: "B",
                producerName: "Prod 2",
                competitorTitle: "Konk 1",
                items: [
                    {
                        date: date1,
                        analogStock: 3,
                        analogPrice: 2.5,
                        btradeStock: 30,
                        btradePrice: 3.0,
                    },
                    {
                        date: date2,
                        analogStock: 4,
                        analogPrice: 2.6,
                        btradeStock: 40,
                        btradePrice: 3.1,
                    },
                ],
            },
            {
                analogId: "a1",
                artikul: "1102-0259",
                artNameUkr: "Товар 1",
                artAbc: "A",
                producerName: "Prod 1",
                competitorTitle: "Konk 1",
                items: [
                    {
                        date: date1,
                        analogStock: 1,
                        analogPrice: 1.5,
                        btradeStock: 10,
                        btradePrice: 2.0,
                    },
                    {
                        date: date2,
                        analogStock: 2,
                        analogPrice: 1.6,
                        btradeStock: 20,
                        btradePrice: 2.1,
                    },
                ],
            },
        ];
        const options = {
            konk: "air",
            prod: "gemar",
            dateFrom: date1,
            dateTo: date2,
        };
        const { buffer, fileName } = await buildKonkBtradeComparisonExcel(analogs, options);
        expect(buffer).toBeInstanceOf(Buffer);
        expect(buffer.length).toBeGreaterThan(0);
        expect(fileName).toContain("konk_btrade_comparison_air_gemar_2026-03-01_2026-03-02");
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);
        const worksheet = workbook.getWorksheet("Порівняння");
        const headerRow = worksheet.getRow(1);
        expect(headerRow.getCell(1).value).toBe("Артикул");
        expect(headerRow.getCell(2).value).toBe("Назва (укр)");
        const analog1StockRow = worksheet.getRow(2);
        const analog2StockRow = worksheet.getRow(6);
        expect(analog1StockRow.getCell(1).value).toBe("1102-0259");
        expect(analog2StockRow.getCell(1).value).toBe("1102-0260");
        expect(analog1StockRow.getCell(5).value).toBe("A");
        expect(analog2StockRow.getCell(5).value).toBe("B");
        expect(analog1StockRow.getCell(7).value).toBe(1);
        expect(analog2StockRow.getCell(7).value).toBe(3);
    });
});

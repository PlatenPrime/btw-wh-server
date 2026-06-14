import { describe, expect, it } from "vitest";
import { buildArtStockExcel } from "../buildArtStockExcel.js";
describe("buildArtStockExcel", () => {
    it("builds xlsx buffer with expected file name", async () => {
        const d1 = new Date("2026-03-01T00:00:00.000Z");
        const d2 = new Date("2026-03-02T00:00:00.000Z");
        const { buffer, fileName } = await buildArtStockExcel({
            artikul: "ART-1",
            artNameUkr: "Товар",
            datesReport: [d1, d2],
            coalescedReport: [
                { quantity: 5, price: 100 },
                { quantity: 3, price: 100 },
            ],
            dateFrom: d1,
            dateTo: d2,
        });
        expect(buffer.length).toBeGreaterThan(0);
        expect(fileName).toBe("art_stock_ART-1_2026-03-01_2026-03-02.xlsx");
    });
});

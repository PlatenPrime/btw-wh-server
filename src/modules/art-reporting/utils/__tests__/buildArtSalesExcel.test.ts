import { describe, expect, it } from "vitest";
import { buildArtSalesExcel } from "../buildArtSalesExcel.js";

describe("buildArtSalesExcel", () => {
  it("builds xlsx buffer with expected file name", async () => {
    const d1 = new Date("2026-03-01T00:00:00.000Z");
    const d2 = new Date("2026-03-02T00:00:00.000Z");
    const { buffer, fileName } = await buildArtSalesExcel({
      artikul: "ART-1",
      artNameUkr: "Товар",
      datesReport: [d1, d2],
      coalescedReport: [
        { quantity: 10, price: 2 },
        { quantity: 7, price: 2 },
      ],
      coalescedFull: [
        { quantity: 10, price: 2 },
        { quantity: 10, price: 2 },
        { quantity: 7, price: 2 },
      ],
      reportIndexStart: 1,
      dateFrom: d1,
      dateTo: d2,
    });

    expect(buffer.length).toBeGreaterThan(0);
    expect(fileName).toBe("art_sales_ART-1_2026-03-01_2026-03-02.xlsx");
  });
});

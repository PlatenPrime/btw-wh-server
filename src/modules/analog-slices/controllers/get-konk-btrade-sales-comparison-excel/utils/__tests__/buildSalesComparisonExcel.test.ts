import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { buildSalesComparisonExcel } from "../buildSalesComparisonExcel.js";

describe("buildSalesComparisonExcel", () => {
  it("builds excel with stacked analog sales blocks and summary", async () => {
    const date1 = new Date("2026-03-01T00:00:00.000Z");
    const date2 = new Date("2026-03-02T00:00:00.000Z");

    const analogs = [
      {
        analogId: "a1",
        artikul: "1102-0259",
        artNameUkr: "Товар 1",
        artAbc: "A",
        producerName: "Prod 1",
        competitorTitle: "Air",
        previousAnalogStock: null,
        previousBtradeStock: null,
        items: [
          {
            date: date1,
            analogStock: 100,
            analogPrice: 10,
            btradeStock: 200,
            btradePrice: 12,
          },
          {
            date: date2,
            analogStock: 90,
            analogPrice: 10,
            btradeStock: 185,
            btradePrice: 12,
          },
        ],
      },
      {
        analogId: "a2",
        artikul: "1102-0260",
        artNameUkr: "Товар 2",
        artAbc: "B",
        producerName: "Prod 2",
        competitorTitle: "Air",
        previousAnalogStock: null,
        previousBtradeStock: null,
        items: [
          {
            date: date1,
            analogStock: 50,
            analogPrice: 20,
            btradeStock: 100,
            btradePrice: 22,
          },
          {
            date: date2,
            analogStock: 40,
            analogPrice: 20,
            btradeStock: 90,
            btradePrice: 22,
          },
        ],
      },
    ];

    const { buffer, fileName } = await buildSalesComparisonExcel(analogs, {
      konk: "air",
      prod: "gemar",
      dateFrom: date1,
      dateTo: date2,
    });

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
    expect(fileName).toBe(
      "sales_comparison_air_gemar_2026-03-01_2026-03-02.xlsx",
    );

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
    const worksheet = workbook.getWorksheet("Порівняння");
    expect(worksheet).toBeDefined();
    expect(worksheet!.getRow(1).getCell(1).value).toBe("Артикул");
    expect(worksheet!.getRow(2).getCell(1).value).toBe("1102-0259");
    expect(worksheet!.getRow(8).getCell(1).value).toBe("1102-0260");
  });

  it("returns empty workbook when analogs have no items", async () => {
    const { buffer, fileName } = await buildSalesComparisonExcel(
      [
        {
          analogId: "a1",
          artikul: "X",
          artNameUkr: null,
          artAbc: null,
          producerName: null,
          competitorTitle: null,
          previousAnalogStock: null,
          previousBtradeStock: null,
          items: [],
        },
      ],
      {
        konk: "air",
        prod: "gemar",
        dateFrom: new Date("2026-03-01T00:00:00.000Z"),
        dateTo: new Date("2026-03-02T00:00:00.000Z"),
      },
    );

    expect(buffer).toBeInstanceOf(Buffer);
    expect(fileName).toContain("sales_comparison_air_gemar");
  });
});

import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import {
  buildSkuSliceExcelForSkus,
  formatDateHeader,
  safeFilePart,
  SKU_SLICE_EXCEL_STOCK_NEW_SKU_FILL_ARGB,
  SKU_SLICE_EXCEL_STOCK_SUPPLY_FILL_ARGB,
} from "../buildSkuSliceExcel.js";

const TITLES = { competitorTitle: "Конкурент UA", producerName: "Виробник UA" };

describe("buildSkuSliceExcelForSkus", () => {
  it("produces xlsx buffer and filename for one sku", async () => {
    const from = new Date("2026-01-10T00:00:00.000Z");
    const to = new Date("2026-01-11T00:00:00.000Z");
    const { buffer, fileName } = await buildSkuSliceExcelForSkus(
      [
        {
          title: "N",
          url: "https://x.com",
          productId: "air-1",
          konkName: "air",
          prodName: "p",
        },
      ],
      from,
      to,
      (_kn, pid, d) => {
        if (pid !== "air-1") return undefined;
        const t = d.getTime();
        if (t === from.getTime()) return { stock: 1, price: 2 };
        if (t === to.getTime()) return { stock: 2, price: 3 };
        return undefined;
      },
      TITLES
    );

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(100);
    expect(fileName).toContain("sku_slice_air-1");
    expect(fileName.endsWith(".xlsx")).toBe(true);
  });

  it("uses stock layout: metric column F, diff columns, merges, no revenue/stats rows", async () => {
    const from = new Date("2026-01-10T00:00:00.000Z");
    const to = new Date("2026-01-11T00:00:00.000Z");
    const { buffer } = await buildSkuSliceExcelForSkus(
      [
        {
          title: "N",
          url: "https://x.com",
          productId: "air-1",
          konkName: "air",
          prodName: "p",
        },
      ],
      from,
      to,
      (_kn, pid, d) => {
        if (pid !== "air-1") return undefined;
        const t = d.getTime();
        if (t === from.getTime()) return { stock: 10, price: 5 };
        if (t === to.getTime()) return { stock: 7, price: 5 };
        return undefined;
      },
      TITLES
    );

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer as unknown as Parameters<typeof wb.xlsx.load>[0]);
    const ws = wb.getWorksheet("Срез");
    expect(ws).toBeDefined();

    expect(ws!.getRow(1).getCell(6).value).toBe("");
    expect(ws!.getRow(1).getCell(7).value).toBe("2026-01-10");
    expect(ws!.getRow(1).getCell(8).value).toBe("2026-01-11");
    expect(ws!.getRow(1).getCell(9).value).toBe("Різниця");
    expect(ws!.getRow(1).getCell(10).value).toBe("Різниця, %");

    expect(ws!.getRow(2).getCell(1).value).toBe("air-1");
    expect(ws!.getRow(2).getCell(3).value).toBe("Конкурент UA");
    expect(ws!.getRow(2).getCell(4).value).toBe("Виробник UA");
    expect(ws!.getRow(2).getCell(6).value).toBe("Залишок");
    expect(ws!.getRow(3).getCell(6).value).toBe("Ціна");
    expect(ws!.getRow(4).getCell(6).value).not.toBe("Виручка");

    expect(ws!.getRow(3).getCell(7).value).toBe(5);
    expect(ws!.getRow(3).getCell(8).value).toBe(5);

    expect(ws!.getRow(2).getCell(9).value).toBe(-3);

    const merged = ws!.model.merges ?? [];
    expect(merged.some((m) => /^A2:A3$/.test(String(m)))).toBe(true);

    let foundStats = false;
    let foundRazom = false;
    ws!.eachRow((row) => {
      const v = row.getCell(1).value;
      if (v === "Статистика продажів") foundStats = true;
      if (v === "Разом") foundRazom = true;
    });
    expect(foundStats).toBe(false);
    expect(foundRazom).toBe(false);
  });

  it("adds konk totals row for diff and diff pct", async () => {
    const from = new Date("2026-01-10T00:00:00.000Z");
    const to = new Date("2026-01-11T00:00:00.000Z");
    const { buffer } = await buildSkuSliceExcelForSkus(
      [
        {
          title: "N1",
          url: "https://x.com/1",
          productId: "air-1",
          konkName: "air",
          prodName: "p",
        },
        {
          title: "N2",
          url: "https://x.com/2",
          productId: "air-2",
          konkName: "air",
          prodName: "p",
        },
      ],
      from,
      to,
      (_kn, pid, d) => {
        const t = d.getTime();
        if (pid === "air-1" && t === from.getTime()) return { stock: 10, price: 5 };
        if (pid === "air-1" && t === to.getTime()) return { stock: 7, price: 6 };
        if (pid === "air-2" && t === from.getTime()) return { stock: 4, price: 8 };
        if (pid === "air-2" && t === to.getTime()) return { stock: 6, price: 8 };
        return undefined;
      },
      TITLES,
      { includeTotalsRow: true, totalsRowLabel: "Підсумок" }
    );

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer as unknown as Parameters<typeof wb.xlsx.load>[0]);
    const ws = wb.getWorksheet("Срез");
    expect(ws).toBeDefined();

    // Two SKU blocks (2 rows each) => totals row starts at row 6.
    expect(ws!.getRow(6).getCell(1).value).toBe("Підсумок");
    expect(ws!.getRow(6).getCell(9).value).toBe(-1); // (-3) + (+2)
    expect(ws!.getRow(6).getCell(10).value).toBe(-7.14); // -1 / (10+4) * 100
  });

  it("highlights stock increase day with supply fill, not red font", async () => {
    const from = new Date("2026-01-10T00:00:00.000Z");
    const to = new Date("2026-01-11T00:00:00.000Z");
    const { buffer } = await buildSkuSliceExcelForSkus(
      [
        {
          title: "N",
          url: "https://x.com",
          productId: "air-1",
          konkName: "air",
          prodName: "p",
        },
      ],
      from,
      to,
      (_kn, pid, d) => {
        if (pid !== "air-1") return undefined;
        const t = d.getTime();
        if (t === from.getTime()) return { stock: 1, price: 2 };
        if (t === to.getTime()) return { stock: 3, price: 2 };
        return undefined;
      },
      TITLES
    );

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer as unknown as Parameters<typeof wb.xlsx.load>[0]);
    const ws = wb.getWorksheet("Срез");
    expect(ws).toBeDefined();

    const stockSecondDay = ws!.getRow(2).getCell(8);
    expect(stockSecondDay.value).toBe(3);
    expect(stockSecondDay.fill).toMatchObject({
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: SKU_SLICE_EXCEL_STOCK_SUPPLY_FILL_ARGB },
    });
    expect(stockSecondDay.font?.color?.argb).not.toBe("FFFF0000");
  });

  it("new sku day fill wins over supply day when both apply", async () => {
    const from = new Date("2026-01-10T00:00:00.000Z");
    const to = new Date("2026-01-11T00:00:00.000Z");
    const { buffer } = await buildSkuSliceExcelForSkus(
      [
        {
          title: "N",
          url: "https://x.com",
          productId: "air-1",
          konkName: "air",
          prodName: "p",
          createdAt: new Date("2026-01-11T12:00:00.000Z"),
        },
      ],
      from,
      to,
      (_kn, pid, d) => {
        if (pid !== "air-1") return undefined;
        const t = d.getTime();
        if (t === from.getTime()) return { stock: 1, price: 2 };
        if (t === to.getTime()) return { stock: 5, price: 2 };
        return undefined;
      },
      TITLES
    );

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer as unknown as Parameters<typeof wb.xlsx.load>[0]);
    const ws = wb.getWorksheet("Срез");
    expect(ws).toBeDefined();

    const stockSecondDay = ws!.getRow(2).getCell(8);
    expect(stockSecondDay.fill).toMatchObject({
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: SKU_SLICE_EXCEL_STOCK_NEW_SKU_FILL_ARGB },
    });
  });

  it("highlights price increase with red font on price row", async () => {
    const from = new Date("2026-01-10T00:00:00.000Z");
    const to = new Date("2026-01-11T00:00:00.000Z");
    const { buffer } = await buildSkuSliceExcelForSkus(
      [
        {
          title: "N",
          url: "https://x.com",
          productId: "air-1",
          konkName: "air",
          prodName: "p",
        },
      ],
      from,
      to,
      (_kn, pid, d) => {
        if (pid !== "air-1") return undefined;
        const t = d.getTime();
        if (t === from.getTime()) return { stock: 1, price: 10 };
        if (t === to.getTime()) return { stock: 1, price: 12 };
        return undefined;
      },
      TITLES
    );

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer as unknown as Parameters<typeof wb.xlsx.load>[0]);
    const ws = wb.getWorksheet("Срез");
    expect(ws).toBeDefined();

    const priceSecondDay = ws!.getRow(3).getCell(8);
    expect(priceSecondDay.value).toBe(12);
    expect(priceSecondDay.font?.color?.argb?.toUpperCase()).toBe("FFFF0000");
  });
});

describe("buildSkuSliceExcel helpers", () => {
  it("formatDateHeader is UTC YYYY-MM-DD", () => {
    expect(
      formatDateHeader(new Date("2026-03-05T00:00:00.000Z"))
    ).toBe("2026-03-05");
  });

  it("safeFilePart strips unsafe chars", () => {
    expect(safeFilePart("a/b:c")).toBe("a_b_c");
  });
});

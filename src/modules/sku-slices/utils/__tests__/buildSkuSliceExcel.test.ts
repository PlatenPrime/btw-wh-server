import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import {
  buildSkuSliceExcelForSkus,
  formatDateHeader,
  safeFilePart,
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

  it("uses analog-like layout: metric column F, diff columns, merges, sales footer", async () => {
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
    expect(ws!.getRow(4).getCell(6).value).toBe("Виручка");

    expect(ws!.getRow(3).getCell(7).value).toBe(5);
    expect(ws!.getRow(3).getCell(8).value).toBe(5);

    expect(ws!.getRow(2).getCell(9).value).toBe(-3);

    const merged = ws!.model.merges ?? [];
    expect(merged.some((m) => /^A2:A4$/.test(String(m)))).toBe(true);

    let foundStats = false;
    let foundRazom = false;
    ws!.eachRow((row) => {
      const v = row.getCell(1).value;
      if (v === "Статистика продажів") foundStats = true;
      if (v === "Разом") foundRazom = true;
    });
    expect(foundStats).toBe(true);
    expect(foundRazom).toBe(true);
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

import { beforeEach, describe, expect, it } from "vitest";
import ExcelJS from "exceljs";
import { Skugr } from "../../../../../skugrs/models/Skugr.js";
import { Sku } from "../../../../../skus/models/Sku.js";
import { SkuSlice } from "../../../../models/SkuSlice.js";
import { formatExcelDateHeaderUk } from "../../../../../../lib/excel/formatExcelDateHeaderUk.js";
import { getKonkSkuSalesExcelUtil } from "../getKonkSkuSalesExcelUtil.js";

describe("getKonkSkuSalesExcelUtil", () => {
  beforeEach(async () => {
    await Sku.deleteMany({});
    await Skugr.deleteMany({});
    await SkuSlice.deleteMany({});
  });

  it("returns ok false when no skus for konk/prod", async () => {
    const result = await getKonkSkuSalesExcelUtil({
      konk: "air",
      prod: "gemar",
      dateFrom: new Date("2026-03-01T00:00:00.000Z"),
      dateTo: new Date("2026-03-01T00:00:00.000Z"),
    });

    expect(result.ok).toBe(false);
  });

  it("returns ok false when prod does not match skus", async () => {
    await Sku.create({
      konkName: "air",
      prodName: "gemar",
      productId: "air-sales-wrong-prod",
      title: "A",
      url: "https://e.com/a",
    });

    const result = await getKonkSkuSalesExcelUtil({
      konk: "air",
      prod: "other",
      dateFrom: new Date("2026-03-01T00:00:00.000Z"),
      dateTo: new Date("2026-03-01T00:00:00.000Z"),
    });

    expect(result.ok).toBe(false);
  });

  it("builds excel for multiple skus of one konk", async () => {
    await Sku.create({
      konkName: "air",
      prodName: "gemar",
      productId: "air-sales-k-1",
      title: "A",
      url: "https://e.com/a",
    });
    await Sku.create({
      konkName: "air",
      prodName: "gemar",
      productId: "air-sales-k-2",
      title: "B",
      url: "https://e.com/b",
    });

    const d1 = new Date("2026-03-01T00:00:00.000Z");
    const d2 = new Date("2026-03-02T00:00:00.000Z");
    await SkuSlice.insertMany([
      {
        konkName: "air",
        date: d1,
        data: {
          "air-sales-k-1": { stock: 5, price: 3 },
          "air-sales-k-2": { stock: 7, price: 4 },
        },
      },
      {
        konkName: "air",
        date: d2,
        data: {
          "air-sales-k-1": { stock: 4, price: 3 },
          "air-sales-k-2": { stock: 2, price: 4 },
        },
      },
    ]);

    const result = await getKonkSkuSalesExcelUtil({
      konk: "air",
      prod: "gemar",
      dateFrom: d1,
      dateTo: d2,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.buffer.length).toBeGreaterThan(200);
      expect(result.fileName).toContain("sku_sales_konk");
      expect(result.fileName).toContain("air");
      expect(result.fileName).toContain("gemar");
    }
  });

  it("sortBy=revenue orders blocks by total revenue desc", async () => {
    const warm = new Date("2026-04-10T00:00:00.000Z");
    const d1 = new Date("2026-04-11T00:00:00.000Z");
    const d2 = new Date("2026-04-12T00:00:00.000Z");
    await Sku.create({
      konkName: "air",
      prodName: "gemar",
      productId: "aaa-many-sales",
      title: "A",
      url: "https://e.com/a",
    });
    await Sku.create({
      konkName: "air",
      prodName: "gemar",
      productId: "zzz-high-revenue",
      title: "Z",
      url: "https://e.com/z",
    });
    await SkuSlice.insertMany([
      {
        konkName: "air",
        date: warm,
        data: {
          "aaa-many-sales": { stock: 100, price: 1 },
          "zzz-high-revenue": { stock: 20, price: 50 },
        },
      },
      {
        konkName: "air",
        date: d1,
        data: {
          "aaa-many-sales": { stock: 80, price: 1 },
          "zzz-high-revenue": { stock: 19, price: 50 },
        },
      },
      {
        konkName: "air",
        date: d2,
        data: {
          "aaa-many-sales": { stock: 70, price: 1 },
          "zzz-high-revenue": { stock: 18, price: 50 },
        },
      },
    ]);

    const result = await getKonkSkuSalesExcelUtil({
      konk: "air",
      prod: "gemar",
      dateFrom: d1,
      dateTo: d2,
      sortBy: "revenue",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(result.buffer as unknown as ArrayBuffer);
    const ws = wb.getWorksheet("Продажі");
    expect(ws?.getRow(1).getCell(8).value).toBe(formatExcelDateHeaderUk(d1));
    expect(ws?.getRow(2).getCell(1).value).toBe("zzz-high-revenue");
    expect(ws?.getRow(5).getCell(1).value).toBe("aaa-many-sales");
  });

  it("default order follows productId ascending", async () => {
    const warm = new Date("2026-05-10T00:00:00.000Z");
    const d1 = new Date("2026-05-11T00:00:00.000Z");
    const d2 = new Date("2026-05-12T00:00:00.000Z");
    await Sku.create({
      konkName: "air",
      prodName: "gemar",
      productId: "zzz-high-sales",
      title: "Z",
      url: "https://e.com/z",
    });
    await Sku.create({
      konkName: "air",
      prodName: "gemar",
      productId: "aaa-low-sales",
      title: "A",
      url: "https://e.com/a",
    });
    await SkuSlice.insertMany([
      {
        konkName: "air",
        date: warm,
        data: {
          "aaa-low-sales": { stock: 10, price: 5 },
          "zzz-high-sales": { stock: 100, price: 2 },
        },
      },
      {
        konkName: "air",
        date: d1,
        data: {
          "aaa-low-sales": { stock: 9, price: 5 },
          "zzz-high-sales": { stock: 50, price: 2 },
        },
      },
      {
        konkName: "air",
        date: d2,
        data: {
          "aaa-low-sales": { stock: 8, price: 5 },
          "zzz-high-sales": { stock: 40, price: 2 },
        },
      },
    ]);

    const result = await getKonkSkuSalesExcelUtil({
      konk: "air",
      prod: "gemar",
      dateFrom: d1,
      dateTo: d2,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(result.buffer as unknown as ArrayBuffer);
    const ws = wb.getWorksheet("Продажі");
    expect(ws?.getRow(2).getCell(1).value).toBe("aaa-low-sales");
    expect(ws?.getRow(5).getCell(1).value).toBe("zzz-high-sales");
  });

  it("filters skus by skugrIds and writes Skugr title into column 5", async () => {
    const sA = await Sku.create({
      konkName: "air",
      prodName: "gemar",
      productId: "air-skugr-a",
      title: "A",
      url: "https://e.com/sa",
    });
    const sB = await Sku.create({
      konkName: "air",
      prodName: "gemar",
      productId: "air-skugr-b",
      title: "B",
      url: "https://e.com/sb",
    });
    await Sku.create({
      konkName: "air",
      prodName: "gemar",
      productId: "air-skugr-c",
      title: "C",
      url: "https://e.com/sc",
    });
    const g = await Skugr.create({
      konkName: "air",
      prodName: "gemar",
      title: "Selected Group",
      url: "https://e.com/g",
      isSliced: true,
      skus: [sA._id, sB._id],
    });

    const d1 = new Date("2026-06-01T00:00:00.000Z");
    const d2 = new Date("2026-06-02T00:00:00.000Z");
    await SkuSlice.insertMany([
      {
        konkName: "air",
        date: d1,
        data: {
          "air-skugr-a": { stock: 5, price: 3 },
          "air-skugr-b": { stock: 4, price: 4 },
          "air-skugr-c": { stock: 9, price: 1 },
        },
      },
      {
        konkName: "air",
        date: d2,
        data: {
          "air-skugr-a": { stock: 4, price: 3 },
          "air-skugr-b": { stock: 1, price: 4 },
          "air-skugr-c": { stock: 8, price: 1 },
        },
      },
    ]);

    const result = await getKonkSkuSalesExcelUtil({
      konk: "air",
      prod: "gemar",
      dateFrom: d1,
      dateTo: d2,
      skugrIds: [g._id.toString()],
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(result.buffer as unknown as ArrayBuffer);
    const ws = wb.getWorksheet("Продажі");
    expect(ws?.getRow(2).getCell(1).value).toBe("air-skugr-a");
    expect(ws?.getRow(5).getCell(1).value).toBe("air-skugr-b");
    expect(ws?.getRow(2).getCell(5).value).toBe("Selected Group");
    let found = false;
    ws?.eachRow((row) => {
      if (row.getCell(1).value === "air-skugr-c") found = true;
    });
    expect(found).toBe(false);
  });

  it("uses day-before-range stock to compute first report day sales and revenue", async () => {
    const warm = new Date("2026-07-10T00:00:00.000Z");
    const d1 = new Date("2026-07-11T00:00:00.000Z");

    await Sku.create({
      konkName: "air",
      prodName: "gemar",
      productId: "air-first-day-delta",
      title: "Warmup SKU",
      url: "https://e.com/warmup",
    });

    await SkuSlice.insertMany([
      {
        konkName: "air",
        date: warm,
        data: { "air-first-day-delta": { stock: 10, price: 5 } },
      },
      {
        konkName: "air",
        date: d1,
        data: { "air-first-day-delta": { stock: 7, price: 5 } },
      },
    ]);

    const result = await getKonkSkuSalesExcelUtil({
      konk: "air",
      prod: "gemar",
      dateFrom: d1,
      dateTo: d1,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(result.buffer as unknown as ArrayBuffer);
    const ws = wb.getWorksheet("Продажі");
    const dataCol = 8;

    expect(ws?.getRow(2).getCell(dataCol).value).toBe(3);
    expect(ws?.getRow(4).getCell(dataCol).value).toBe(15);
    expect(ws?.getRow(2).getCell(dataCol + 1).value).toBe(3);
    expect(ws?.getRow(4).getCell(dataCol + 1).value).toBe(15);
  });
});

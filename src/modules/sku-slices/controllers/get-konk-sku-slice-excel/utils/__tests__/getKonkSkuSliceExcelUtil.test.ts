import ExcelJS from "exceljs";
import { beforeEach, describe, expect, it } from "vitest";
import { Prod } from "../../../../../prods/models/Prod.js";
import { Skugr } from "../../../../../skugrs/models/Skugr.js";
import { Sku } from "../../../../../skus/models/Sku.js";
import { SkuSlice } from "../../../../models/SkuSlice.js";
import { getKonkSkuSliceExcelUtil } from "../getKonkSkuSliceExcelUtil.js";

describe("getKonkSkuSliceExcelUtil", () => {
  beforeEach(async () => {
    await Sku.deleteMany({});
    await Skugr.deleteMany({});
    await SkuSlice.deleteMany({});
  });

  it("returns ok false when no skus for konk prod", async () => {
    const r = await getKonkSkuSliceExcelUtil({
      konk: "air",
      prod: "none",
      dateFrom: new Date("2026-03-01T00:00:00.000Z"),
      dateTo: new Date("2026-03-01T00:00:00.000Z"),
    });
    expect(r.ok).toBe(false);
  });

  it("builds excel for multiple skus", async () => {
    await Sku.create({
      konkName: "air",
      prodName: "gemar",
      productId: "air-k-1",
      title: "A",
      url: "https://e.com/a",
    });
    await Sku.create({
      konkName: "air",
      prodName: "gemar",
      productId: "air-k-2",
      title: "B",
      url: "https://e.com/b",
    });
    const d = new Date("2026-03-01T00:00:00.000Z");
    await SkuSlice.create({
      konkName: "air",
      date: d,
      data: {
        "air-k-1": { stock: 1, price: 2 },
        "air-k-2": { stock: 3, price: 4 },
      },
    });

    const r = await getKonkSkuSliceExcelUtil({
      konk: "air",
      prod: "gemar",
      dateFrom: d,
      dateTo: d,
    });

    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.buffer.length).toBeGreaterThan(200);
      expect(r.fileName).toContain("konk");
      expect(r.fileName).toContain("air");
      expect(r.fileName).toContain("gemar");
    }
  });

  it("filters skus by skugrIds and writes Skugr title into column 5", async () => {
    const sA = await Sku.create({
      konkName: "air",
      prodName: "gemar",
      productId: "air-slice-skugr-a",
      title: "A",
      url: "https://e.com/a",
    });
    await Sku.create({
      konkName: "air",
      prodName: "gemar",
      productId: "air-slice-skugr-b",
      title: "B",
      url: "https://e.com/b",
    });

    const g = await Skugr.create({
      konkName: "air",
      prodName: "gemar",
      title: "Filtered Group",
      url: "https://e.com/g",
      isSliced: true,
      skus: [sA._id],
    });

    const d = new Date("2026-03-15T00:00:00.000Z");
    await SkuSlice.create({
      konkName: "air",
      date: d,
      data: {
        "air-slice-skugr-a": { stock: 4, price: 5 },
        "air-slice-skugr-b": { stock: 6, price: 7 },
      },
    });

    const r = await getKonkSkuSliceExcelUtil({
      konk: "air",
      prod: "gemar",
      dateFrom: d,
      dateTo: d,
      skugrIds: [g._id.toString()],
    });

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(r.buffer as unknown as ArrayBuffer);
    const ws = wb.getWorksheet("Срез");
    expect(ws?.getRow(2).getCell(1).value).toBe("air-slice-skugr-a");
    expect(ws?.getRow(2).getCell(5).value).toBe("Filtered Group");
    let foundB = false;
    ws?.eachRow((row) => {
      if (row.getCell(1).value === "air-slice-skugr-b") foundB = true;
    });
    expect(foundB).toBe(false);
  });

  it("prod=all with skugrIds writes per-row producer titles and all in fileName", async () => {
    await Prod.create({
      name: "p1",
      title: "Producer One",
      imageUrl: "https://example.com/p1.png",
    });
    await Prod.create({
      name: "p2",
      title: "Producer Two",
      imageUrl: "https://example.com/p2.png",
    });

    const sA = await Sku.create({
      konkName: "air",
      prodName: "p1",
      productId: "air-slice-all-p1",
      title: "A",
      url: "https://e.com/a",
    });
    const sB = await Sku.create({
      konkName: "air",
      prodName: "p2",
      productId: "air-slice-all-p2",
      title: "B",
      url: "https://e.com/b",
    });

    const g1 = await Skugr.create({
      konkName: "air",
      prodName: "p1",
      title: "Group P1",
      url: "https://e.com/g1",
      isSliced: true,
      skus: [sA._id],
    });
    const g2 = await Skugr.create({
      konkName: "air",
      prodName: "p2",
      title: "Group P2",
      url: "https://e.com/g2",
      isSliced: true,
      skus: [sB._id],
    });

    const d = new Date("2026-03-20T00:00:00.000Z");
    await SkuSlice.create({
      konkName: "air",
      date: d,
      data: {
        "air-slice-all-p1": { stock: 4, price: 5 },
        "air-slice-all-p2": { stock: 6, price: 7 },
      },
    });

    const r = await getKonkSkuSliceExcelUtil({
      konk: "air",
      prod: "all",
      dateFrom: d,
      dateTo: d,
      skugrIds: [g1._id.toString(), g2._id.toString()],
    });

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.fileName).toContain("_all_");

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(r.buffer as unknown as ArrayBuffer);
    const ws = wb.getWorksheet("Срез");
    expect(ws?.getRow(2).getCell(1).value).toBe("air-slice-all-p1");
    expect(ws?.getRow(2).getCell(4).value).toBe("Producer One");
    expect(ws?.getRow(4).getCell(1).value).toBe("air-slice-all-p2");
    expect(ws?.getRow(4).getCell(4).value).toBe("Producer Two");
  });
});

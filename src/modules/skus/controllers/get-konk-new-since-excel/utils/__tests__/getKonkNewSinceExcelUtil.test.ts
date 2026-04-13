import ExcelJS from "exceljs";
import { beforeEach, describe, expect, it } from "vitest";
import { Konk } from "../../../../../konks/models/Konk.js";
import { Sku } from "../../../../models/Sku.js";
import { SKU_EXCEL_ALL_KONKS } from "../../../../constants/skuExcelKonkAll.js";
import { getKonkNewSinceExcelUtil } from "../getKonkNewSinceExcelUtil.js";

describe("getKonkNewSinceExcelUtil", () => {
  beforeEach(async () => {
    await Sku.deleteMany({});
    await Konk.deleteMany({});
  });

  it("writes Konk.title column for a single konk", async () => {
    await Konk.create({
      name: "air",
      title: "Air Shop",
      url: "https://air.example",
      imageUrl: "https://air.example/i.png",
    });
    const since = new Date("2026-04-01T00:00:00.000Z");
    await Sku.create({
      konkName: "air",
      prodName: "p",
      productId: "air-n-1",
      title: "New one",
      url: "https://ex.com/n1",
      createdAt: new Date("2026-04-05T00:00:00.000Z"),
    });

    const { buffer } = await getKonkNewSinceExcelUtil("air", { since });
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer as unknown as ArrayBuffer);
    const sheet = wb.getWorksheet("SKU");
    expect(sheet).toBeDefined();
    expect(sheet!.getRow(1).getCell(3).value).toBe("Конкурент (назва)");
    expect(sheet!.getRow(2).getCell(2).value).toBe("air");
    expect(sheet!.getRow(2).getCell(3).value).toBe("Air Shop");
  });

  it("when konkName is all, includes new skus for every konk with titles", async () => {
    await Konk.create({
      name: "air",
      title: "Air Shop",
      url: "https://air.example",
      imageUrl: "https://air.example/i.png",
    });
    await Konk.create({
      name: "rozetka",
      title: "Rozetka UA",
      url: "https://roz.example",
      imageUrl: "https://roz.example/i.png",
    });
    const since = new Date("2026-04-01T00:00:00.000Z");
    await Sku.create({
      konkName: "rozetka",
      prodName: "p",
      productId: "roz-n-1",
      title: "R new",
      url: "https://ex.com/rn1",
      createdAt: new Date("2026-04-10T00:00:00.000Z"),
    });
    await Sku.create({
      konkName: "air",
      prodName: "p",
      productId: "air-n-2",
      title: "A new",
      url: "https://ex.com/an2",
      createdAt: new Date("2026-04-08T00:00:00.000Z"),
    });
    await Sku.create({
      konkName: "air",
      prodName: "p",
      productId: "air-old",
      title: "Old",
      url: "https://ex.com/old",
      createdAt: new Date("2026-03-01T00:00:00.000Z"),
    });

    const { buffer, fileName } = await getKonkNewSinceExcelUtil(SKU_EXCEL_ALL_KONKS, {
      since,
    });
    expect(fileName).toContain("all");

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer as unknown as ArrayBuffer);
    const sheet = wb.getWorksheet("SKU");
    expect(sheet!.rowCount).toBe(3);

    const byKonk = new Map<string, { title: string; skuTitle: string }>();
    for (let r = 2; r <= sheet!.rowCount; r++) {
      const k = String(sheet!.getRow(r).getCell(2).value ?? "");
      byKonk.set(k, {
        title: String(sheet!.getRow(r).getCell(3).value ?? ""),
        skuTitle: String(sheet!.getRow(r).getCell(5).value ?? ""),
      });
    }

    expect(byKonk.get("rozetka")).toEqual({
      title: "Rozetka UA",
      skuTitle: "R new",
    });
    expect(byKonk.get("air")).toEqual({
      title: "Air Shop",
      skuTitle: "A new",
    });
  });
});

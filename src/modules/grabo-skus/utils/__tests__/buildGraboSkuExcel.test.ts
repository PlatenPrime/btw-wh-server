import ExcelJS from "exceljs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FIT_COLUMN_MAX_WIDTH } from "../../../../lib/excel/fitColumnWidths.js";
import { GRABO_SKU_EXCEL_COLUMNS } from "../../constants/graboSkuExcelColumns.js";
import { buildGraboSkuExcelBuffer } from "../buildGraboSkuExcel.js";

function columnIndex(key: (typeof GRABO_SKU_EXCEL_COLUMNS)[number]["key"]): number {
  return GRABO_SKU_EXCEL_COLUMNS.findIndex((col) => col.key === key) + 1;
}

describe("buildGraboSkuExcelBuffer", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-08-16T10:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("writes custom headers, bold font, and all model fields except mongo id", async () => {
    const lastSeenAt = new Date("2026-08-15T10:00:00.000Z");
    const createdAt = new Date("2026-08-01T00:00:00.000Z");
    const updatedAt = new Date("2026-08-15T11:00:00.000Z");

    const { buffer, fileName } = await buildGraboSkuExcelBuffer([
      {
        productId: "G1",
        title: "Bow",
        url: "https://www.grabo-balloons.com/en/g1-balloon-bow",
        isNewProduct: true,
        color: "Pink",
        size: "M",
        material: "Foil",
        gas: "Helium",
        language: "No text",
        gasCapacity: "air only",
        tags: ["Girl", "Party"],
        images: ["https://img/a.jpg", "https://img/b.jpg"],
        isOnSite: false,
        lastSeenAt,
        createdAt,
        updatedAt,
      },
    ]);

    expect(fileName).toBe("grabo-catalog-2026-08-16.xlsx");

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer as unknown as ArrayBuffer);
    const sheet = wb.getWorksheet("GraboSku");
    expect(sheet).toBeDefined();

    for (let i = 0; i < GRABO_SKU_EXCEL_COLUMNS.length; i++) {
      const cell = sheet!.getRow(1).getCell(i + 1);
      expect(cell.value).toBe(GRABO_SKU_EXCEL_COLUMNS[i]!.header);
      expect(cell.font?.bold).toBe(true);
    }

    const data = sheet!.getRow(2);
    expect(data.getCell(columnIndex("productId")).value).toBe("G1");
    expect(data.getCell(columnIndex("isNewProduct")).value).toBe(true);
    expect(data.getCell(columnIndex("tags")).value).toBe("Girl; Party");
    expect(data.getCell(columnIndex("images")).value).toBe(
      "https://img/a.jpg; https://img/b.jpg"
    );
    expect(data.getCell(columnIndex("isOnSite")).value).toBe(false);
    expect(data.getCell(columnIndex("lastSeenAt")).value).toBe(
      lastSeenAt.toISOString()
    );
    expect(data.getCell(columnIndex("createdAt")).value).toBe(
      createdAt.toISOString()
    );
  });

  it("fits column width to content and caps long url/images", async () => {
    const longUrl = `https://www.grabo-balloons.com/en/${"x".repeat(80)}`;
    const { buffer } = await buildGraboSkuExcelBuffer([
      {
        productId: "G1",
        title: "Bow",
        url: longUrl,
        isNewProduct: false,
        color: "Pink",
        size: "M",
        material: "Foil",
        gas: "Helium",
        language: "No text",
        gasCapacity: "air only",
        tags: [],
        images: [longUrl, longUrl],
        isOnSite: true,
        lastSeenAt: new Date("2026-08-15T10:00:00.000Z"),
      },
    ]);

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer as unknown as ArrayBuffer);
    const sheet = wb.getWorksheet("GraboSku")!;

    const sizeWidth = sheet.getColumn(columnIndex("size")).width ?? 0;
    const urlWidth = sheet.getColumn(columnIndex("url")).width ?? 0;
    const imagesWidth = sheet.getColumn(columnIndex("images")).width ?? 0;

    expect(sizeWidth).toBeLessThan(urlWidth);
    expect(urlWidth).toBe(FIT_COLUMN_MAX_WIDTH);
    expect(imagesWidth).toBe(FIT_COLUMN_MAX_WIDTH);
  });

  it("writes empty date cells when createdAt/updatedAt are missing", async () => {
    const { buffer } = await buildGraboSkuExcelBuffer([
      {
        productId: "G1",
        title: "Bow",
        url: "https://example.com/g1",
        isNewProduct: false,
        color: "",
        size: "",
        material: "",
        gas: "",
        language: "",
        gasCapacity: "",
        tags: [],
        images: [],
        isOnSite: true,
        lastSeenAt: new Date("2026-08-15T10:00:00.000Z"),
      },
    ]);

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer as unknown as ArrayBuffer);
    const sheet = wb.getWorksheet("GraboSku")!;
    const data = sheet.getRow(2);
    expect(data.getCell(columnIndex("createdAt")).value ?? "").toBe("");
    expect(data.getCell(columnIndex("updatedAt")).value ?? "").toBe("");
  });

  it("names file with Kyiv calendar date after UTC midnight", async () => {
    vi.setSystemTime(new Date("2026-08-15T22:00:00.000Z"));
    const { fileName } = await buildGraboSkuExcelBuffer([]);
    expect(fileName).toBe("grabo-catalog-2026-08-16.xlsx");
  });
});

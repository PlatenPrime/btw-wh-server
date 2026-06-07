import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { buildSkuCatalogExcelBuffer } from "../buildSkuCatalogExcel.js";

describe("buildSkuCatalogExcelBuffer", () => {
  it("writes header and data rows with Ukrainian labels", async () => {
    const { buffer, fileName } = await buildSkuCatalogExcelBuffer(
      [
        {
          productId: "air-1",
          konkName: "air",
          konkTitle: "Air Shop",
          prodName: "maker",
          title: "Widget",
          url: "https://ex.com/w",
          createdAt: new Date("2026-04-01T12:00:00.000Z"),
          isInvalid: true,
        },
      ],
      "catalog-test",
    );

    expect(fileName).toBe("catalog-test.xlsx");

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer as unknown as ArrayBuffer);
    const sheet = wb.getWorksheet("SKU");
    expect(sheet).toBeDefined();
    expect(sheet!.getRow(1).getCell(1).value).toBe("Ідентифікатор товару");
    expect(sheet!.getRow(2).getCell(1).value).toBe("air-1");
    expect(sheet!.getRow(2).getCell(3).value).toBe("Air Shop");
    expect(sheet!.getRow(2).getCell(8).value).toBe("так");
  });

  it("writes ні for valid sku and empty date when createdAt missing", async () => {
    const { buffer } = await buildSkuCatalogExcelBuffer(
      [
        {
          productId: "air-2",
          konkName: "air",
          konkTitle: "",
          prodName: "maker",
          title: "Gadget",
          url: "https://ex.com/g",
          isInvalid: false,
        },
      ],
      "catalog-empty-date",
    );

    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer as unknown as ArrayBuffer);
    const sheet = wb.getWorksheet("SKU");
    expect(sheet!.getRow(2).getCell(7).value).toBe("");
    expect(sheet!.getRow(2).getCell(8).value).toBe("ні");
  });
});

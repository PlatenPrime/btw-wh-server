import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import type { SkugrSkuSalesRow } from "../../../../sku-sales-reports/controllers/get-skugr-skus-sales/utils/getSkugrSkusSalesUtil.js";
import {
  SKU_SHARE_PHOTO_COLUMN_WIDTH,
  SKU_SKUGR_SKUS_SHARE_HEADERS,
  SKU_SKUGR_SKUS_SHARE_SHEET_NAME,
  buildSkuSkugrSkusShareExcel,
  previewRowHeightPt,
  skuSkugrSkusShareFileName,
  totalSharePercent,
} from "../buildSkuSkugrSkusShareExcel.js";

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);

function sku(
  partial: Partial<SkugrSkuSalesRow> & Pick<SkugrSkuSalesRow, "skuId">,
): SkugrSkuSalesRow {
  return {
    title: partial.title ?? partial.skuId,
    productId: partial.productId ?? partial.skuId,
    artikul: partial.artikul ?? "",
    imageUrl: partial.imageUrl ?? "",
    salesPcs: partial.salesPcs ?? 0,
    salesUah: partial.salesUah ?? 0,
    skuId: partial.skuId,
  };
}

async function loadSheet(buffer: Buffer): Promise<ExcelJS.Worksheet> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);
  const sheet = workbook.getWorksheet(SKU_SKUGR_SKUS_SHARE_SHEET_NAME);
  if (!sheet) throw new Error("missing sheet");
  return sheet;
}

describe("share excel helpers", () => {
  it("sizes a photo row in points without shrinking below the default", () => {
    expect(previewRowHeightPt(100)).toBe(75);
    expect(previewRowHeightPt(10)).toBe(15);
  });

  it("uses 100 only for a non-zero total", () => {
    expect(totalSharePercent(0)).toBe(0);
    expect(totalSharePercent(4)).toBe(100);
  });

  it("builds the file name from the raw period", () => {
    expect(skuSkugrSkusShareFileName("abc", "2026-10-26", "2026-11-03")).toBe(
      "sku_skugr_skus_share_abc_2026-10-26_2026-11-03.xlsx",
    );
  });
});

describe("buildSkuSkugrSkusShareExcel", () => {
  it("writes header, total, shares and a preview only on the sku row when includeImages", async () => {
    const built = await buildSkuSkugrSkusShareExcel({
      skugrId: "507f1f77bcf86cd799439011",
      dateFrom: "2026-10-26",
      dateTo: "2026-11-03",
      includeImages: true,
      all: { title: "Усього", salesPcs: 4, salesUah: 40 },
      rows: [
        sku({ skuId: "a", title: "A", artikul: "A-1", salesPcs: 1, salesUah: 10 }),
        sku({
          skuId: "b",
          title: "B",
          artikul: "B-2",
          salesPcs: 3,
          salesUah: 30,
          imageUrl: "https://cdn.example/b.jpg",
        }),
      ],
      previews: new Map([["b", { buffer: JPEG, width: 100, height: 100 }]]),
    });

    expect(built.fileName).toBe(
      "sku_skugr_skus_share_507f1f77bcf86cd799439011_2026-10-26_2026-11-03.xlsx",
    );
    const sheet = await loadSheet(built.buffer);
    SKU_SKUGR_SKUS_SHARE_HEADERS.forEach((title, index) => {
      expect(sheet.getRow(1).getCell(index + 1).value).toBe(title);
    });
    expect(sheet.getColumn(1).width).toBeCloseTo(SKU_SHARE_PHOTO_COLUMN_WIDTH);

    const total = sheet.getRow(2);
    expect(total.getCell(1).value).toBeNull();
    expect(total.getCell(2).value).toBe("Усього");
    expect(total.getCell(3).value).toBe("");
    expect(total.getCell(4).value).toBe(4);
    expect(total.getCell(5).value).toBe(40);
    expect(total.getCell(6).value).toBe(100);
    expect(total.getCell(7).value).toBe(100);
    expect(total.getCell(6).numFmt).toBe("0.00");
    expect(total.getCell(7).numFmt).toBe("0.00");
    expect(total.getCell(2).font?.bold).toBe(true);

    const first = sheet.getRow(3);
    expect(first.getCell(2).value).toBe("A");
    expect(first.getCell(3).value).toBe("A-1");
    expect(first.getCell(6).value).toBe(25);
    expect(first.getCell(7).value).toBe(25);
    expect(first.getCell(6).numFmt).toBe("0.00");
    expect(first.height == null || first.height === 15).toBe(true);

    const second = sheet.getRow(4);
    expect(second.getCell(2).value).toBe("B");
    expect(second.getCell(3).value).toBe("B-2");
    expect(second.getCell(4).value).toBe(3);
    expect(second.getCell(6).value).toBe(75);
    expect(second.getCell(7).value).toBe(75);
    expect(second.height).toBe(previewRowHeightPt(100));

    const images = sheet.getImages();
    expect(images).toHaveLength(1);
    const range = images[0]?.range as {
      tl: { nativeRow?: number };
      ext?: { width?: number; height?: number };
    };
    expect(range.tl.nativeRow).toBe(3);
    expect(range.ext?.width).toBeCloseTo(100);
    expect(range.ext?.height).toBeCloseTo(100);
  });

  it("omits photo column when includeImages is false", async () => {
    const built = await buildSkuSkugrSkusShareExcel({
      skugrId: "507f1f77bcf86cd799439011",
      dateFrom: "2026-10-26",
      dateTo: "2026-10-26",
      includeImages: false,
      all: { title: "Усього", salesPcs: 1, salesUah: 10 },
      rows: [sku({ skuId: "a", title: "A", artikul: "X", salesPcs: 1, salesUah: 10 })],
      previews: new Map([["a", { buffer: JPEG, width: 100, height: 100 }]]),
    });
    const sheet = await loadSheet(built.buffer);
    expect(sheet.getRow(1).getCell(1).value).toBe("Товар");
    expect(sheet.getRow(1).getCell(2).value).toBe("Артикул");
    expect(sheet.getRow(2).getCell(1).value).toBe("Усього");
    expect(sheet.getRow(3).getCell(1).value).toBe("A");
    expect(sheet.getRow(3).getCell(2).value).toBe("X");
    expect(sheet.getImages()).toHaveLength(0);
  });

  it("writes zero shares when the period total is zero", async () => {
    const built = await buildSkuSkugrSkusShareExcel({
      skugrId: "507f1f77bcf86cd799439011",
      dateFrom: "2026-10-26",
      dateTo: "2026-10-26",
      all: { title: "Усього", salesPcs: 0, salesUah: 0 },
      rows: [sku({ skuId: "a", title: "A" })],
      previews: new Map(),
    });
    const sheet = await loadSheet(built.buffer);
    expect(sheet.getRow(2).getCell(5).value).toBe(0);
    expect(sheet.getRow(2).getCell(6).value).toBe(0);
    expect(sheet.getRow(3).getCell(5).value).toBe(0);
    expect(sheet.getRow(3).getCell(6).value).toBe(0);
    expect(sheet.getImages()).toHaveLength(0);
  });

  it("splits a zero pcs total from a non-zero revenue total", async () => {
    const built = await buildSkuSkugrSkusShareExcel({
      skugrId: "507f1f77bcf86cd799439011",
      dateFrom: "2026-10-26",
      dateTo: "2026-10-26",
      all: { title: "Усього", salesPcs: 0, salesUah: 10 },
      rows: [],
      previews: new Map(),
    });
    const sheet = await loadSheet(built.buffer);
    expect(sheet.getRow(2).getCell(5).value).toBe(0);
    expect(sheet.getRow(2).getCell(6).value).toBe(100);
    expect(sheet.getRow(3).getCell(1).value ?? null).toBeNull();
  });
});

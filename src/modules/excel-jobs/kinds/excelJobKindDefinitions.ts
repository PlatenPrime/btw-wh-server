import { z } from "zod";
import { getAnalogBtradeComparisonExcelSchema } from "../../analog-slices/controllers/get-analog-btrade-comparison-excel/schemas/getAnalogBtradeComparisonExcelSchema.js";
import { getAnalogSalesComparisonExcelSchema } from "../../analog-slices/controllers/get-analog-sales-comparison-excel/schemas/getAnalogSalesComparisonExcelSchema.js";
import { getKonkBtradeComparisonExcelSchema } from "../../analog-slices/controllers/get-konk-btrade-comparison-excel/schemas/getKonkBtradeComparisonExcelSchema.js";
import { getKonkBtradeSalesComparisonExcelSchema } from "../../analog-slices/controllers/get-konk-btrade-sales-comparison-excel/schemas/getKonkBtradeSalesComparisonExcelSchema.js";
import { getArtStockExcelSchema } from "../../art-excel-reports/controllers/get-art-stock-excel/schemas/getArtStockExcelSchema.js";
import { RoleType } from "../../../constants/roles.js";
import { getCatalogInvalidExcelQuerySchema } from "../../sku-excel-reports/controllers/get-catalog-invalid-excel/schemas/getCatalogInvalidExcelSchema.js";
import { getCatalogNewSinceExcelQuerySchema } from "../../sku-excel-reports/controllers/get-catalog-new-since-excel/schemas/getCatalogNewSinceExcelSchema.js";
import { getKonkSkuSalesExcelSchema } from "../../sku-excel-reports/controllers/get-konk-sku-sales-excel/schemas/getKonkSkuSalesExcelSchema.js";
import { getKonkSkuSliceExcelSchema } from "../../sku-excel-reports/controllers/get-konk-sku-slice-excel/schemas/getKonkSkuSliceExcelSchema.js";
import { getSkuSalesExcelSchema } from "../../sku-excel-reports/controllers/get-sku-sales-excel/schemas/getSkuSalesExcelSchema.js";
import { getSkuSliceExcelSchema } from "../../sku-excel-reports/controllers/get-sku-slice-excel/schemas/getSkuSliceExcelSchema.js";
import { getSkugrSalesExcelSchema } from "../../sku-excel-reports/controllers/get-skugr-sales-excel/schemas/getSkugrSalesExcelSchema.js";
import { getSkugrSliceExcelSchema } from "../../sku-excel-reports/controllers/get-skugr-slice-excel/schemas/getSkugrSliceExcelSchema.js";
import {
  isExcelJobKind,
  type ExcelJobKind,
} from "../constants/excelJobConstants.js";

export const emptyExcelJobParamsSchema = z.object({});

export const posesExportStocksParamsSchema = z
  .object({
    sklad: z.enum(["merezhi", "pogrebi"]).optional(),
  })
  .strict();

export type ExcelJobKindDefinition = {
  kind: ExcelJobKind;
  minRole: RoleType;
  schema: z.ZodTypeAny;
  oldPath: string;
};

export const EXCEL_JOB_KIND_DEFINITIONS: Record<ExcelJobKind, ExcelJobKindDefinition> = {
  "sku-catalog-new-since": {
    kind: "sku-catalog-new-since",
    minRole: RoleType.ADMIN,
    schema: getCatalogNewSinceExcelQuerySchema,
    oldPath: "GET /api/sku-excel-reports/catalog/new-since",
  },
  "sku-catalog-invalid": {
    kind: "sku-catalog-invalid",
    minRole: RoleType.ADMIN,
    schema: getCatalogInvalidExcelQuerySchema,
    oldPath: "GET /api/sku-excel-reports/catalog/invalid",
  },
  "sku-konk-stock": {
    kind: "sku-konk-stock",
    minRole: RoleType.ADMIN,
    schema: getKonkSkuSliceExcelSchema,
    oldPath: "GET /api/sku-excel-reports/konk/stock",
  },
  "sku-konk-sales": {
    kind: "sku-konk-sales",
    minRole: RoleType.ADMIN,
    schema: getKonkSkuSalesExcelSchema,
    oldPath: "GET /api/sku-excel-reports/konk/sales",
  },
  "sku-skugr-stock": {
    kind: "sku-skugr-stock",
    minRole: RoleType.ADMIN,
    schema: getSkugrSliceExcelSchema,
    oldPath: "GET /api/sku-excel-reports/skugr/:skugrId/stock",
  },
  "sku-skugr-sales": {
    kind: "sku-skugr-sales",
    minRole: RoleType.ADMIN,
    schema: getSkugrSalesExcelSchema,
    oldPath: "GET /api/sku-excel-reports/skugr/:skugrId/sales",
  },
  "sku-one-stock": {
    kind: "sku-one-stock",
    minRole: RoleType.ADMIN,
    schema: getSkuSliceExcelSchema,
    oldPath: "GET /api/sku-excel-reports/sku/:skuId/stock",
  },
  "sku-one-sales": {
    kind: "sku-one-sales",
    minRole: RoleType.ADMIN,
    schema: getSkuSalesExcelSchema,
    oldPath: "GET /api/sku-excel-reports/sku/:skuId/sales",
  },
  "art-stock": {
    kind: "art-stock",
    minRole: RoleType.ADMIN,
    schema: getArtStockExcelSchema,
    oldPath: "GET /api/art-excel-reports/artikul/:artikul/stock",
  },
  "art-sales": {
    kind: "art-sales",
    minRole: RoleType.ADMIN,
    schema: getArtStockExcelSchema,
    oldPath: "GET /api/art-excel-reports/artikul/:artikul/sales",
  },
  "analog-comparison": {
    kind: "analog-comparison",
    minRole: RoleType.ADMIN,
    schema: getAnalogBtradeComparisonExcelSchema,
    oldPath: "GET /api/analog-slices/analog/:analogId/comparison-excel",
  },
  "analog-sales-comparison": {
    kind: "analog-sales-comparison",
    minRole: RoleType.ADMIN,
    schema: getAnalogSalesComparisonExcelSchema,
    oldPath: "GET /api/analog-slices/analog/:analogId/sales-comparison-excel",
  },
  "konk-btrade-comparison": {
    kind: "konk-btrade-comparison",
    minRole: RoleType.ADMIN,
    schema: getKonkBtradeComparisonExcelSchema,
    oldPath: "GET /api/analog-slices/konk-btrade/comparison-excel",
  },
  "konk-btrade-sales-comparison": {
    kind: "konk-btrade-sales-comparison",
    minRole: RoleType.ADMIN,
    schema: getKonkBtradeSalesComparisonExcelSchema,
    oldPath: "GET /api/analog-slices/konk-btrade/sales-comparison-excel",
  },
  "arts-export": {
    kind: "arts-export",
    minRole: RoleType.ADMIN,
    schema: emptyExcelJobParamsSchema,
    oldPath: "GET /api/arts/export",
  },
  "arts-export-with-stocks": {
    kind: "arts-export-with-stocks",
    minRole: RoleType.ADMIN,
    schema: emptyExcelJobParamsSchema,
    oldPath: "GET /api/arts/export-with-stocks",
  },
  "arts-export-keys": {
    kind: "arts-export-keys",
    minRole: RoleType.ADMIN,
    schema: emptyExcelJobParamsSchema,
    oldPath: "GET /api/arts/export-keys",
  },
  "poses-export-stocks": {
    kind: "poses-export-stocks",
    minRole: RoleType.ADMIN,
    schema: posesExportStocksParamsSchema,
    oldPath: "POST /api/poses/export-stocks",
  },
  "zones-export": {
    kind: "zones-export",
    minRole: RoleType.ADMIN,
    schema: emptyExcelJobParamsSchema,
    oldPath: "GET /api/zones/export",
  },
  "grabo-skus": {
    kind: "grabo-skus",
    minRole: RoleType.ADMIN,
    schema: emptyExcelJobParamsSchema,
    oldPath: "GET /api/grabo-skus/excel",
  },
};

export function getExcelJobKindDefinition(
  kind: string,
): ExcelJobKindDefinition | undefined {
  if (!isExcelJobKind(kind)) {
    return undefined;
  }
  return EXCEL_JOB_KIND_DEFINITIONS[kind];
}

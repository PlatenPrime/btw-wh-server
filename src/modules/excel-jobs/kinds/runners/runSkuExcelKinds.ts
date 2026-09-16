import { notifyExcelBuildProgress } from "../../../../lib/excel/excelBuildProgress.js";
import { getKonkInvalidExcelUtil } from "../../../sku-excel-reports/controllers/get-catalog-invalid-excel/utils/getKonkInvalidExcelUtil.js";
import { getCatalogInvalidExcelQuerySchema } from "../../../sku-excel-reports/controllers/get-catalog-invalid-excel/schemas/getCatalogInvalidExcelSchema.js";
import { getCatalogNewSinceExcelQuerySchema } from "../../../sku-excel-reports/controllers/get-catalog-new-since-excel/schemas/getCatalogNewSinceExcelSchema.js";
import { getKonkNewSinceExcelUtil } from "../../../sku-excel-reports/controllers/get-catalog-new-since-excel/utils/getKonkNewSinceExcelUtil.js";
import { getKonkSkuSalesExcelSchema } from "../../../sku-excel-reports/controllers/get-konk-sku-sales-excel/schemas/getKonkSkuSalesExcelSchema.js";
import { getKonkSkuSalesExcelUtil } from "../../../sku-excel-reports/controllers/get-konk-sku-sales-excel/utils/getKonkSkuSalesExcelUtil.js";
import { getKonkSkuSliceExcelSchema } from "../../../sku-excel-reports/controllers/get-konk-sku-slice-excel/schemas/getKonkSkuSliceExcelSchema.js";
import { getKonkSkuSliceExcelUtil } from "../../../sku-excel-reports/controllers/get-konk-sku-slice-excel/utils/getKonkSkuSliceExcelUtil.js";
import { getSkuSalesExcelSchema } from "../../../sku-excel-reports/controllers/get-sku-sales-excel/schemas/getSkuSalesExcelSchema.js";
import { getSkuSalesExcelUtil } from "../../../sku-excel-reports/controllers/get-sku-sales-excel/utils/getSkuSalesExcelUtil.js";
import { getSkuSliceExcelSchema } from "../../../sku-excel-reports/controllers/get-sku-slice-excel/schemas/getSkuSliceExcelSchema.js";
import { getSkuSliceExcelUtil } from "../../../sku-excel-reports/controllers/get-sku-slice-excel/utils/getSkuSliceExcelUtil.js";
import { getSkugrSalesExcelSchema } from "../../../sku-excel-reports/controllers/get-skugr-sales-excel/schemas/getSkugrSalesExcelSchema.js";
import { getSkugrSalesExcelUtil } from "../../../sku-excel-reports/controllers/get-skugr-sales-excel/utils/getSkugrSalesExcelUtil.js";
import { getSkugrSliceExcelSchema } from "../../../sku-excel-reports/controllers/get-skugr-slice-excel/schemas/getSkugrSliceExcelSchema.js";
import { getSkugrSliceExcelUtil } from "../../../sku-excel-reports/controllers/get-skugr-slice-excel/utils/getSkugrSliceExcelUtil.js";
import {
  failExcelJobRun,
  okExcelJobRun,
  type ExcelJobKindRunner,
} from "../excelJobRunTypes.js";

const SKU_NOT_FOUND = "No skus found for provided filters, or sku has no productId";

function wrapOkFalse(
  result: { ok: true; buffer: Buffer; fileName: string } | { ok: false },
) {
  if (!result.ok) {
    return failExcelJobRun(SKU_NOT_FOUND);
  }
  return okExcelJobRun(result.buffer, result.fileName);
}

export const runSkuCatalogNewSince: ExcelJobKindRunner = async (
  params,
  options,
) => {
  const parsed = getCatalogNewSinceExcelQuerySchema.safeParse(params);
  if (!parsed.success) {
    return failExcelJobRun("Validation error");
  }
  notifyExcelBuildProgress(options?.onProgress, 0, 1);
  const built = await getKonkNewSinceExcelUtil(parsed.data.konk, {
    since: parsed.data.since,
  });
  notifyExcelBuildProgress(options?.onProgress, 1, 1);
  return okExcelJobRun(built.buffer, built.fileName);
};

export const runSkuCatalogInvalid: ExcelJobKindRunner = async (
  params,
  options,
) => {
  const parsed = getCatalogInvalidExcelQuerySchema.safeParse(params);
  if (!parsed.success) {
    return failExcelJobRun("Validation error");
  }
  notifyExcelBuildProgress(options?.onProgress, 0, 1);
  const built = await getKonkInvalidExcelUtil(parsed.data.konk);
  notifyExcelBuildProgress(options?.onProgress, 1, 1);
  return okExcelJobRun(built.buffer, built.fileName);
};

export const runSkuKonkStock: ExcelJobKindRunner = async (params, options) => {
  const parsed = getKonkSkuSliceExcelSchema.safeParse(params);
  if (!parsed.success) {
    return failExcelJobRun("Validation error");
  }
  return wrapOkFalse(
    await getKonkSkuSliceExcelUtil(parsed.data, {
      onProgress: options?.onProgress,
    }),
  );
};

export const runSkuKonkSales: ExcelJobKindRunner = async (params, options) => {
  const parsed = getKonkSkuSalesExcelSchema.safeParse(params);
  if (!parsed.success) {
    return failExcelJobRun("Validation error");
  }
  return wrapOkFalse(
    await getKonkSkuSalesExcelUtil(parsed.data, {
      onProgress: options?.onProgress,
    }),
  );
};

export const runSkuSkugrStock: ExcelJobKindRunner = async (params, options) => {
  const parsed = getSkugrSliceExcelSchema.safeParse(params);
  if (!parsed.success) {
    return failExcelJobRun("Validation error");
  }
  return wrapOkFalse(
    await getSkugrSliceExcelUtil(parsed.data, {
      onProgress: options?.onProgress,
    }),
  );
};

export const runSkuSkugrSales: ExcelJobKindRunner = async (params, options) => {
  const parsed = getSkugrSalesExcelSchema.safeParse(params);
  if (!parsed.success) {
    return failExcelJobRun("Validation error");
  }
  return wrapOkFalse(
    await getSkugrSalesExcelUtil(parsed.data, {
      onProgress: options?.onProgress,
    }),
  );
};

export const runSkuOneStock: ExcelJobKindRunner = async (params, options) => {
  const parsed = getSkuSliceExcelSchema.safeParse(params);
  if (!parsed.success) {
    return failExcelJobRun("Validation error");
  }
  return wrapOkFalse(
    await getSkuSliceExcelUtil(parsed.data, {
      onProgress: options?.onProgress,
    }),
  );
};

export const runSkuOneSales: ExcelJobKindRunner = async (params, options) => {
  const parsed = getSkuSalesExcelSchema.safeParse(params);
  if (!parsed.success) {
    return failExcelJobRun("Validation error");
  }
  return wrapOkFalse(
    await getSkuSalesExcelUtil(parsed.data, {
      onProgress: options?.onProgress,
    }),
  );
};

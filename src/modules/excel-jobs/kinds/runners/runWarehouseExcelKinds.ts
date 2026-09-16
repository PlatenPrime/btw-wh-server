import { notifyExcelBuildProgress } from "../../../../lib/excel/excelBuildProgress.js";
import { getArtSalesExcelUtil } from "../../../art-excel-reports/controllers/get-art-sales-excel/utils/getArtSalesExcelUtil.js";
import { getArtStockExcelSchema } from "../../../art-excel-reports/controllers/get-art-stock-excel/schemas/getArtStockExcelSchema.js";
import { getArtStockExcelUtil } from "../../../art-excel-reports/controllers/get-art-stock-excel/utils/getArtStockExcelUtil.js";
import { formatArtsForExcelWithKeysUtil } from "../../../arts/controllers/export-arts-to-excel-with-keys/utils/formatArtsForExcelWithKeysUtil.js";
import { generateExcelWithKeysUtil } from "../../../arts/controllers/export-arts-to-excel-with-keys/utils/generateExcelWithKeysUtil.js";
import { getArtsForExportWithKeysUtil } from "../../../arts/controllers/export-arts-to-excel-with-keys/utils/getArtsForExportWithKeysUtil.js";
import { formatArtsForExcelExtendedUtil } from "../../../arts/controllers/export-arts-to-excel-with-stocks/utils/formatArtsForExcelExtendedUtil.js";
import { generateExcelExtendedUtil } from "../../../arts/controllers/export-arts-to-excel-with-stocks/utils/generateExcelExtendedUtil.js";
import { getArtsForExportExtendedUtil } from "../../../arts/controllers/export-arts-to-excel-with-stocks/utils/getArtsForExportExtendedUtil.js";
import { getPosesQuantByArtikulUtil } from "../../../arts/controllers/export-arts-to-excel-with-stocks/utils/getPosesQuantByArtikulUtil.js";
import { formatArtsForExcelUtil } from "../../../arts/controllers/export-arts-to-excel/utils/formatArtsForExcelUtil.js";
import { generateExcelUtil } from "../../../arts/controllers/export-arts-to-excel/utils/generateExcelUtil.js";
import { getArtsForExportUtil } from "../../../arts/controllers/export-arts-to-excel/utils/getArtsForExportUtil.js";
import { getGraboSkuExcelUtil } from "../../../grabo-skus/controllers/get-grabo-sku-excel/utils/getGraboSkuExcelUtil.js";
import { formatPosesStocksForExcelUtil } from "../../../poses/controllers/export-poses-stocks-to-excel/utils/formatPosesStocksForExcelUtil.js";
import { generateExcelUtil as generatePosesStocksExcelUtil } from "../../../poses/controllers/export-poses-stocks-to-excel/utils/generateExcelUtil.js";
import { getPosesStocksForExportUtil } from "../../../poses/controllers/export-poses-stocks-to-excel/utils/getPosesStocksForExportUtil.js";
import { formatZonesForExcelUtil } from "../../../zones/controllers/export-zones-to-excel/utils/formatZonesForExcelUtil.js";
import { generateExcelUtil as generateZonesExcelUtil } from "../../../zones/controllers/export-zones-to-excel/utils/generateExcelUtil.js";
import { getZonesForExportUtil } from "../../../zones/controllers/export-zones-to-excel/utils/getZonesForExportUtil.js";
import { emptyExcelJobParamsSchema, posesExportStocksParamsSchema } from "../excelJobKindDefinitions.js";
import {
  failExcelJobRun,
  okExcelJobRun,
  type ExcelJobKindRunner,
} from "../excelJobRunTypes.js";

export const runArtStock: ExcelJobKindRunner = async (params, options) => {
  const parsed = getArtStockExcelSchema.safeParse(params);
  if (!parsed.success) {
    return failExcelJobRun("Validation error");
  }
  notifyExcelBuildProgress(options?.onProgress, 0, 1);
  const result = await getArtStockExcelUtil(parsed.data);
  if (!result.ok) {
    return failExcelJobRun("Art not found for provided artikul");
  }
  notifyExcelBuildProgress(options?.onProgress, 1, 1);
  return okExcelJobRun(result.buffer, result.fileName);
};

export const runArtSales: ExcelJobKindRunner = async (params, options) => {
  const parsed = getArtStockExcelSchema.safeParse(params);
  if (!parsed.success) {
    return failExcelJobRun("Validation error");
  }
  notifyExcelBuildProgress(options?.onProgress, 0, 1);
  const result = await getArtSalesExcelUtil(parsed.data);
  if (!result.ok) {
    return failExcelJobRun("Art not found for provided artikul");
  }
  notifyExcelBuildProgress(options?.onProgress, 1, 1);
  return okExcelJobRun(result.buffer, result.fileName);
};

export const runArtsExport: ExcelJobKindRunner = async (params, options) => {
  const parsed = emptyExcelJobParamsSchema.safeParse(params ?? {});
  if (!parsed.success) {
    return failExcelJobRun("Validation error");
  }
  notifyExcelBuildProgress(options?.onProgress, 0, 1);
  const arts = await getArtsForExportUtil();
  if (!arts || arts.length === 0) {
    return failExcelJobRun("No arts found to export");
  }
  const built = await generateExcelUtil(formatArtsForExcelUtil(arts));
  notifyExcelBuildProgress(options?.onProgress, 1, 1);
  return okExcelJobRun(built.buffer, built.fileName);
};

export const runArtsExportWithStocks: ExcelJobKindRunner = async (
  params,
  options,
) => {
  const parsed = emptyExcelJobParamsSchema.safeParse(params ?? {});
  if (!parsed.success) {
    return failExcelJobRun("Validation error");
  }
  notifyExcelBuildProgress(options?.onProgress, 0, 1);
  const arts = await getArtsForExportExtendedUtil();
  if (!arts || arts.length === 0) {
    return failExcelJobRun("No arts found to export");
  }
  const posesQuantMap = await getPosesQuantByArtikulUtil();
  const built = await generateExcelExtendedUtil(
    formatArtsForExcelExtendedUtil(arts, posesQuantMap),
  );
  notifyExcelBuildProgress(options?.onProgress, 1, 1);
  return okExcelJobRun(built.buffer, built.fileName);
};

export const runArtsExportKeys: ExcelJobKindRunner = async (params, options) => {
  const parsed = emptyExcelJobParamsSchema.safeParse(params ?? {});
  if (!parsed.success) {
    return failExcelJobRun("Validation error");
  }
  notifyExcelBuildProgress(options?.onProgress, 0, 1);
  const arts = await getArtsForExportWithKeysUtil();
  if (!arts || arts.length === 0) {
    return failExcelJobRun("No arts found to export");
  }
  const built = await generateExcelWithKeysUtil(
    formatArtsForExcelWithKeysUtil(arts),
  );
  notifyExcelBuildProgress(options?.onProgress, 1, 1);
  return okExcelJobRun(built.buffer, built.fileName);
};

export const runPosesExportStocks: ExcelJobKindRunner = async (params, options) => {
  const parsed = posesExportStocksParamsSchema.safeParse(params ?? {});
  if (!parsed.success) {
    return failExcelJobRun("Validation error");
  }
  notifyExcelBuildProgress(options?.onProgress, 0, 1);
  const sklad = parsed.data.sklad;
  const poses = await getPosesStocksForExportUtil(sklad);
  if (!poses.length) {
    return failExcelJobRun("Нет позиций с остатками для экспорта");
  }
  const built = await generatePosesStocksExcelUtil(
    formatPosesStocksForExcelUtil(poses, { selectedSklad: sklad }),
    sklad,
  );
  notifyExcelBuildProgress(options?.onProgress, 1, 1);
  return okExcelJobRun(built.buffer, built.fileName);
};

export const runZonesExport: ExcelJobKindRunner = async (params, options) => {
  const parsed = emptyExcelJobParamsSchema.safeParse(params ?? {});
  if (!parsed.success) {
    return failExcelJobRun("Validation error");
  }
  notifyExcelBuildProgress(options?.onProgress, 0, 1);
  const zones = await getZonesForExportUtil();
  if (!zones || zones.length === 0) {
    return failExcelJobRun("No zones found to export");
  }
  const built = await generateZonesExcelUtil(formatZonesForExcelUtil(zones));
  notifyExcelBuildProgress(options?.onProgress, 1, 1);
  return okExcelJobRun(built.buffer, built.fileName);
};

export const runGraboSkus: ExcelJobKindRunner = async (params, options) => {
  const parsed = emptyExcelJobParamsSchema.safeParse(params ?? {});
  if (!parsed.success) {
    return failExcelJobRun("Validation error");
  }
  notifyExcelBuildProgress(options?.onProgress, 0, 1);
  const built = await getGraboSkuExcelUtil();
  notifyExcelBuildProgress(options?.onProgress, 1, 1);
  return okExcelJobRun(built.buffer, built.fileName);
};

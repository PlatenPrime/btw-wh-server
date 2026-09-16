import { notifyExcelBuildProgress } from "../../../../lib/excel/excelBuildProgress.js";
import { getAnalogBtradeComparisonExcelSchema } from "../../../analog-slices/controllers/get-analog-btrade-comparison-excel/schemas/getAnalogBtradeComparisonExcelSchema.js";
import { buildAnalogBtradeComparisonExcel } from "../../../analog-slices/controllers/get-analog-btrade-comparison-excel/utils/buildAnalogBtradeComparisonExcel.js";
import { getAnalogBtradeComparisonRangeUtil } from "../../../analog-slices/controllers/get-analog-btrade-comparison-excel/utils/getAnalogBtradeComparisonRangeUtil.js";
import { getAnalogSalesComparisonExcelSchema } from "../../../analog-slices/controllers/get-analog-sales-comparison-excel/schemas/getAnalogSalesComparisonExcelSchema.js";
import { buildAnalogSalesComparisonExcel } from "../../../analog-slices/controllers/get-analog-sales-comparison-excel/utils/buildAnalogSalesComparisonExcel.js";
import { getKonkBtradeComparisonExcelSchema } from "../../../analog-slices/controllers/get-konk-btrade-comparison-excel/schemas/getKonkBtradeComparisonExcelSchema.js";
import { buildKonkBtradeComparisonExcel } from "../../../analog-slices/controllers/get-konk-btrade-comparison-excel/utils/buildKonkBtradeComparisonExcel.js";
import { getKonkBtradeComparisonRangeUtil } from "../../../analog-slices/controllers/get-konk-btrade-comparison-excel/utils/getKonkBtradeComparisonRangeUtil.js";
import { getKonkBtradeSalesComparisonExcelSchema } from "../../../analog-slices/controllers/get-konk-btrade-sales-comparison-excel/schemas/getKonkBtradeSalesComparisonExcelSchema.js";
import { buildSalesComparisonExcel } from "../../../analog-slices/controllers/get-konk-btrade-sales-comparison-excel/utils/buildSalesComparisonExcel.js";
import {
  failExcelJobRun,
  okExcelJobRun,
  type ExcelJobKindRunner,
} from "../excelJobRunTypes.js";

export const runAnalogComparison: ExcelJobKindRunner = async (params, options) => {
  const parsed = getAnalogBtradeComparisonExcelSchema.safeParse(params);
  if (!parsed.success) {
    return failExcelJobRun("Validation error");
  }
  notifyExcelBuildProgress(options?.onProgress, 0, 1);
  const rangeResult = await getAnalogBtradeComparisonRangeUtil(parsed.data);
  if (!rangeResult.ok) {
    return failExcelJobRun("Analog not found or analog has no artikul");
  }
  const built = await buildAnalogBtradeComparisonExcel(rangeResult.data, {
    artikul: rangeResult.artikul,
    artNameUkr: rangeResult.artNameUkr,
    artAbc: rangeResult.artAbc,
    producerName: rangeResult.producerName,
    competitorTitle: rangeResult.competitorTitle,
    dateFrom: parsed.data.dateFrom,
    dateTo: parsed.data.dateTo,
  });
  notifyExcelBuildProgress(options?.onProgress, 1, 1);
  return okExcelJobRun(built.buffer, built.fileName);
};

export const runAnalogSalesComparison: ExcelJobKindRunner = async (
  params,
  options,
) => {
  const parsed = getAnalogSalesComparisonExcelSchema.safeParse(params);
  if (!parsed.success) {
    return failExcelJobRun("Validation error");
  }
  notifyExcelBuildProgress(options?.onProgress, 0, 1);
  const rangeResult = await getAnalogBtradeComparisonRangeUtil(parsed.data);
  if (!rangeResult.ok) {
    return failExcelJobRun("Analog not found or analog has no artikul");
  }
  const built = await buildAnalogSalesComparisonExcel(rangeResult.data, {
    artikul: rangeResult.artikul,
    artNameUkr: rangeResult.artNameUkr,
    artAbc: rangeResult.artAbc,
    producerName: rangeResult.producerName,
    competitorTitle: rangeResult.competitorTitle,
    recountDays: rangeResult.recountDays,
    dateFrom: parsed.data.dateFrom,
    dateTo: parsed.data.dateTo,
  });
  notifyExcelBuildProgress(options?.onProgress, 1, 1);
  return okExcelJobRun(built.buffer, built.fileName);
};

export const runKonkBtradeComparison: ExcelJobKindRunner = async (
  params,
  options,
) => {
  const parsed = getKonkBtradeComparisonExcelSchema.safeParse(params);
  if (!parsed.success) {
    return failExcelJobRun("Validation error");
  }
  notifyExcelBuildProgress(options?.onProgress, 0, 1);
  const rangeResult = await getKonkBtradeComparisonRangeUtil(parsed.data);
  if (!rangeResult.ok) {
    return failExcelJobRun("Analogs not found for provided konk/prod");
  }
  const built = await buildKonkBtradeComparisonExcel(rangeResult.analogs, {
    konk: rangeResult.konk,
    prod: rangeResult.prod,
    dateFrom: rangeResult.dateFrom,
    dateTo: rangeResult.dateTo,
  });
  notifyExcelBuildProgress(options?.onProgress, 1, 1);
  return okExcelJobRun(built.buffer, built.fileName);
};

export const runKonkBtradeSalesComparison: ExcelJobKindRunner = async (
  params,
  options,
) => {
  const parsed = getKonkBtradeSalesComparisonExcelSchema.safeParse(params);
  if (!parsed.success) {
    return failExcelJobRun("Validation error");
  }
  notifyExcelBuildProgress(options?.onProgress, 0, 1);
  const rangeResult = await getKonkBtradeComparisonRangeUtil(parsed.data);
  if (!rangeResult.ok) {
    return failExcelJobRun("Analogs not found for provided konk/prod");
  }
  const built = await buildSalesComparisonExcel(rangeResult.analogs, {
    konk: rangeResult.konk,
    prod: rangeResult.prod,
    dateFrom: rangeResult.dateFrom,
    dateTo: rangeResult.dateTo,
    recountDays: rangeResult.recountDays,
  });
  notifyExcelBuildProgress(options?.onProgress, 1, 1);
  return okExcelJobRun(built.buffer, built.fileName);
};

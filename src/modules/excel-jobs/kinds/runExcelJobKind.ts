import type { ExcelJobKind } from "../constants/excelJobConstants.js";
import { failExcelJobRun, type ExcelJobKindRunner, type ExcelJobRunOptions, type ExcelJobRunResult } from "./excelJobRunTypes.js";
import {
  runAnalogComparison,
  runAnalogSalesComparison,
  runKonkBtradeComparison,
  runKonkBtradeSalesComparison,
} from "./runners/runAnalogExcelKinds.js";
import {
  runSkuCatalogInvalid,
  runSkuCatalogNewSince,
  runSkuKonkSales,
  runSkuKonkStock,
  runSkuOneSales,
  runSkuOneStock,
  runSkuSkugrSales,
  runSkuSkugrStock,
} from "./runners/runSkuExcelKinds.js";
import {
  runArtSales,
  runArtStock,
  runArtsExport,
  runArtsExportKeys,
  runArtsExportWithStocks,
  runGraboSkus,
  runPosesExportStocks,
  runZonesExport,
} from "./runners/runWarehouseExcelKinds.js";

const RUNNERS: Record<ExcelJobKind, ExcelJobKindRunner> = {
  "sku-catalog-new-since": runSkuCatalogNewSince,
  "sku-catalog-invalid": runSkuCatalogInvalid,
  "sku-konk-stock": runSkuKonkStock,
  "sku-konk-sales": runSkuKonkSales,
  "sku-skugr-stock": runSkuSkugrStock,
  "sku-skugr-sales": runSkuSkugrSales,
  "sku-one-stock": runSkuOneStock,
  "sku-one-sales": runSkuOneSales,
  "art-stock": runArtStock,
  "art-sales": runArtSales,
  "analog-comparison": runAnalogComparison,
  "analog-sales-comparison": runAnalogSalesComparison,
  "konk-btrade-comparison": runKonkBtradeComparison,
  "konk-btrade-sales-comparison": runKonkBtradeSalesComparison,
  "arts-export": runArtsExport,
  "arts-export-with-stocks": runArtsExportWithStocks,
  "arts-export-keys": runArtsExportKeys,
  "poses-export-stocks": runPosesExportStocks,
  "zones-export": runZonesExport,
  "grabo-skus": runGraboSkus,
};

export async function runExcelJobKind(
  kind: ExcelJobKind,
  params: unknown,
  options?: ExcelJobRunOptions,
): Promise<ExcelJobRunResult> {
  const runner = RUNNERS[kind];
  if (!runner) {
    return failExcelJobRun(`Unknown excel job kind: ${kind}`);
  }
  return runner(params, options);
}

import { createMigratedExcelController } from "../../../excel-jobs/utils/sendExcelJobsMigrated.js";

export const getKonkSkuStockSliceExcelController =
  createMigratedExcelController("sku-konk-stock");

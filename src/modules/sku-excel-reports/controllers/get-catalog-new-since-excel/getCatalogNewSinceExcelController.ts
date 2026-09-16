import { createMigratedExcelController } from "../../../excel-jobs/utils/sendExcelJobsMigrated.js";

export const getCatalogNewSinceExcelController =
  createMigratedExcelController("sku-catalog-new-since");

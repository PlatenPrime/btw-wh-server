import { createMigratedExcelController } from "../../../excel-jobs/utils/sendExcelJobsMigrated.js";

export const getCatalogInvalidExcelController =
  createMigratedExcelController("sku-catalog-invalid");

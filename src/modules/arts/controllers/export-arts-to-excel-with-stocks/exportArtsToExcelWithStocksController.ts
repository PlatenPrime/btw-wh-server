import { createMigratedExcelController } from "../../../excel-jobs/utils/sendExcelJobsMigrated.js";

export const exportArtsToExcelWithStocksController =
  createMigratedExcelController("arts-export-with-stocks");

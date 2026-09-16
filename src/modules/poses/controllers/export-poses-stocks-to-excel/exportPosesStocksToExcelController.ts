import { createMigratedExcelController } from "../../../excel-jobs/utils/sendExcelJobsMigrated.js";

export const exportPosesStocksToExcelController =
  createMigratedExcelController("poses-export-stocks");

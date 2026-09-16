import { createMigratedExcelController } from "../../../excel-jobs/utils/sendExcelJobsMigrated.js";

export const exportArtsToExcelWithKeysController =
  createMigratedExcelController("arts-export-keys");

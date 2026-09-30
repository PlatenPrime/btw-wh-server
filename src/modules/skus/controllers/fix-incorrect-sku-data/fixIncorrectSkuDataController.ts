import { createMigratedApiTaskController } from "../../../apitasks/utils/sendApiTasksMigrated.js";

/**
 * @deprecated Migrated to POST /api/apitasks kind=skus.fix-incorrect-sku-data
 * @route   POST /api/skus/fix-incorrect-sku-data
 */
export const fixIncorrectSkuDataController = createMigratedApiTaskController(
  "skus.fix-incorrect-sku-data",
);

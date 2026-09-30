import { createMigratedApiTaskController } from "../../../apitasks/utils/sendApiTasksMigrated.js";

/**
 * @deprecated Migrated to POST /api/apitasks kind=sku-slices.skugr-run-today
 * @route   POST /api/sku-slices/skugr/:skugrId/run-today
 */
export const runSkugrSlicesTodayController = createMigratedApiTaskController(
  "sku-slices.skugr-run-today",
);

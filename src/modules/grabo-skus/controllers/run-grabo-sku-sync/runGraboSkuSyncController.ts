import { createMigratedApiTaskController } from "../../../apitasks/utils/sendApiTasksMigrated.js";

/**
 * @deprecated Migrated to POST /api/apitasks kind=grabo-skus.sync
 * @route   POST /api/grabo-skus/sync
 */
export const runGraboSkuSyncController = createMigratedApiTaskController(
  "grabo-skus.sync",
);

import { createMigratedApiTaskController } from "../../../apitasks/utils/sendApiTasksMigrated.js";

/**
 * @deprecated Migrated to POST /api/apitasks kind=skus.delete-not-in-any-skugr
 * @route   DELETE /api/skus/not-in-any-skugr
 */
export const deleteSkusNotInAnySkugrController = createMigratedApiTaskController(
  "skus.delete-not-in-any-skugr",
);

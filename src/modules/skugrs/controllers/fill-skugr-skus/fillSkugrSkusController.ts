import { createMigratedApiTaskController } from "../../../apitasks/utils/sendApiTasksMigrated.js";

/**
 * @deprecated Migrated to POST /api/apitasks kind=skugrs.fill-skus
 * @route   POST /api/skugrs/id/:id/fill-skus
 */
export const fillSkugrSkusController = createMigratedApiTaskController(
  "skugrs.fill-skus",
);

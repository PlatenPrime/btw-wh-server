import { createMigratedApiTaskController } from "../../../apitasks/utils/sendApiTasksMigrated.js";

/**
 * @deprecated Migrated to POST /api/apitasks kind=dels.artikuls-update-all
 * @route   POST /api/dels/:id/artikuls/update-all
 */
export const updateDelArtikulsByDelIdController = createMigratedApiTaskController(
  "dels.artikuls-update-all",
);

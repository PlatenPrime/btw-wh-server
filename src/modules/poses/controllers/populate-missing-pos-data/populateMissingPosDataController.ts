import { createMigratedApiTaskController } from "../../../apitasks/utils/sendApiTasksMigrated.js";

/**
 * @deprecated Migrated to POST /api/apitasks kind=poses.populate-missing-data
 * @route   POST /api/poses/populate-missing-data
 */
export const populateMissingPosDataController = createMigratedApiTaskController(
  "poses.populate-missing-data",
);

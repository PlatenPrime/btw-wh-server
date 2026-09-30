import { createMigratedApiTaskController } from "../../../apitasks/utils/sendApiTasksMigrated.js";

/**
 * @deprecated Migrated to POST /api/apitasks kind=arts.delete-without-latest-marker
 * @route   DELETE /api/arts/without-latest-marker
 */
export const deleteArtsWithoutLatestMarkerController =
  createMigratedApiTaskController("arts.delete-without-latest-marker");

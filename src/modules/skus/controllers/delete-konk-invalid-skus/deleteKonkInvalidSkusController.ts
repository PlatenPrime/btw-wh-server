import { createMigratedApiTaskController } from "../../../apitasks/utils/sendApiTasksMigrated.js";

/**
 * @deprecated Migrated to POST /api/apitasks kind=skus.delete-konk-invalid
 * @route   DELETE /api/skus/konk/:konkName/invalid
 */
export const deleteKonkInvalidSkusController = createMigratedApiTaskController(
  "skus.delete-konk-invalid",
);

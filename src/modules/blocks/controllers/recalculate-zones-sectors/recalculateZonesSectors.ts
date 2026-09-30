import { createMigratedApiTaskController } from "../../../apitasks/utils/sendApiTasksMigrated.js";

/**
 * @deprecated Migrated to POST /api/apitasks kind=blocks.recalculate-zones-sectors
 * @route   POST /api/blocks/recalculate-zones-sectors
 */
export const recalculateZonesSectors = createMigratedApiTaskController(
  "blocks.recalculate-zones-sectors",
);

import { createMigratedApiTaskController } from "../../../apitasks/utils/sendApiTasksMigrated.js";

/**
 * @deprecated Migrated to POST /api/apitasks kind=pallet-groups.recalculate-pallets-sectors
 * @route   POST /api/pallet-groups/recalculate-pallets-sectors
 */
export const recalculatePalletsSectorsController =
  createMigratedApiTaskController(
    "pallet-groups.recalculate-pallets-sectors",
  );

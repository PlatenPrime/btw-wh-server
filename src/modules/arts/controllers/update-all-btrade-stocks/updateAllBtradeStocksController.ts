import { createMigratedApiTaskController } from "../../../apitasks/utils/sendApiTasksMigrated.js";

/**
 * @deprecated Migrated to POST /api/apitasks kind=arts.btrade-stock-update-all
 * @route   POST /api/arts/btrade-stock/update-all
 */
export const updateAllBtradeStocksController = createMigratedApiTaskController(
  "arts.btrade-stock-update-all",
);

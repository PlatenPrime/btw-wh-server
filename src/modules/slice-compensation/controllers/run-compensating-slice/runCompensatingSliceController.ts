import { createMigratedApiTaskController } from "../../../apitasks/utils/sendApiTasksMigrated.js";

/**
 * @deprecated Migrated to POST /api/apitasks kind=slice-compensation.run
 * @route   POST /api/slice-compensation/run
 */
export const runCompensatingSliceController = createMigratedApiTaskController(
  "slice-compensation.run",
);

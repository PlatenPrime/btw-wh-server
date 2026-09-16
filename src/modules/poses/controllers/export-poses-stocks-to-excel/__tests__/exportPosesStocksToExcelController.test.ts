import { describe, it } from "vitest";
import { assertMigratedExcelController } from "../../../../excel-jobs/test/assertMigratedExcelController.js";
import { exportPosesStocksToExcelController } from "../exportPosesStocksToExcelController.js";

describe("exportPosesStocksToExcelController", () => {
  it("returns 410 EXCEL_JOBS_MIGRATED", async () => {
    await assertMigratedExcelController(
      exportPosesStocksToExcelController,
      "poses-export-stocks",
    );
  });
});

import { describe, it } from "vitest";
import { assertMigratedExcelController } from "../../../excel-jobs/test/assertMigratedExcelController.js";
import { exportArtsToExcelWithStocksController } from "../export-arts-to-excel-with-stocks/exportArtsToExcelWithStocksController.js";

describe("exportArtsToExcelWithStocksController", () => {
  it("returns 410 EXCEL_JOBS_MIGRATED", async () => {
    await assertMigratedExcelController(
      exportArtsToExcelWithStocksController,
      "arts-export-with-stocks",
    );
  });
});

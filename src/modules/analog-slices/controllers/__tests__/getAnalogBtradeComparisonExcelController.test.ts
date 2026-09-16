import { describe, it } from "vitest";
import { assertMigratedExcelController } from "../../../excel-jobs/test/assertMigratedExcelController.js";
import { getAnalogBtradeComparisonExcelController } from "../get-analog-btrade-comparison-excel/getAnalogBtradeComparisonExcelController.js";

describe("getAnalogBtradeComparisonExcelController", () => {
  it("returns 410 EXCEL_JOBS_MIGRATED", async () => {
    await assertMigratedExcelController(
      getAnalogBtradeComparisonExcelController,
      "analog-comparison",
    );
  });
});

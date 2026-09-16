import { describe, it } from "vitest";
import { assertMigratedExcelController } from "../../../excel-jobs/test/assertMigratedExcelController.js";
import { getAnalogSalesComparisonExcelController } from "../get-analog-sales-comparison-excel/getAnalogSalesComparisonExcelController.js";

describe("getAnalogSalesComparisonExcelController", () => {
  it("returns 410 EXCEL_JOBS_MIGRATED", async () => {
    await assertMigratedExcelController(
      getAnalogSalesComparisonExcelController,
      "analog-sales-comparison",
    );
  });
});

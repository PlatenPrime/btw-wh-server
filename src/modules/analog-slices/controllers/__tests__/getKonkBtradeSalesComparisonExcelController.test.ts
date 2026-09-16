import { describe, it } from "vitest";
import { assertMigratedExcelController } from "../../../excel-jobs/test/assertMigratedExcelController.js";
import { getKonkBtradeSalesComparisonExcelController } from "../get-konk-btrade-sales-comparison-excel/getKonkBtradeSalesComparisonExcelController.js";

describe("getKonkBtradeSalesComparisonExcelController", () => {
  it("returns 410 EXCEL_JOBS_MIGRATED", async () => {
    await assertMigratedExcelController(
      getKonkBtradeSalesComparisonExcelController,
      "konk-btrade-sales-comparison",
    );
  });
});

import { describe, it } from "vitest";
import { assertMigratedExcelController } from "../../../excel-jobs/test/assertMigratedExcelController.js";
import { getKonkBtradeComparisonExcelController } from "../get-konk-btrade-comparison-excel/getKonkBtradeComparisonExcelController.js";

describe("getKonkBtradeComparisonExcelController", () => {
  it("returns 410 EXCEL_JOBS_MIGRATED", async () => {
    await assertMigratedExcelController(
      getKonkBtradeComparisonExcelController,
      "konk-btrade-comparison",
    );
  });
});

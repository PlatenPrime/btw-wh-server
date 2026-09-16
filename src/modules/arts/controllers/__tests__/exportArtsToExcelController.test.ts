import { describe, it } from "vitest";
import { assertMigratedExcelController } from "../../../excel-jobs/test/assertMigratedExcelController.js";
import { exportArtsToExcelController } from "../export-arts-to-excel/exportArtsToExcelController.js";

describe("exportArtsToExcelController", () => {
  it("returns 410 EXCEL_JOBS_MIGRATED", async () => {
    await assertMigratedExcelController(exportArtsToExcelController, "arts-export");
  });
});

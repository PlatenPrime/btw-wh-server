import { describe, it } from "vitest";
import { assertMigratedExcelController } from "../../../excel-jobs/test/assertMigratedExcelController.js";
import { exportZonesToExcelController } from "../export-zones-to-excel/exportZonesToExcel.js";

describe("exportZonesToExcel Controller", () => {
  it("returns 410 EXCEL_JOBS_MIGRATED", async () => {
    await assertMigratedExcelController(exportZonesToExcelController, "zones-export");
  });
});

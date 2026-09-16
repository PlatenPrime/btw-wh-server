import { describe, it } from "vitest";
import { assertMigratedExcelController } from "../../../excel-jobs/test/assertMigratedExcelController.js";
import { exportArtsToExcelWithKeysController } from "../export-arts-to-excel-with-keys/exportArtsToExcelWithKeysController.js";

describe("exportArtsToExcelWithKeysController", () => {
  it("returns 410 EXCEL_JOBS_MIGRATED", async () => {
    await assertMigratedExcelController(
      exportArtsToExcelWithKeysController,
      "arts-export-keys",
    );
  });
});

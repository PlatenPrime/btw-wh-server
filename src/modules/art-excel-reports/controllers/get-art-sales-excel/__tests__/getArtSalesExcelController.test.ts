import { describe, it } from "vitest";
import { assertMigratedExcelController } from "../../../../excel-jobs/test/assertMigratedExcelController.js";
import { getArtSalesExcelController } from "../getArtSalesExcelController.js";

describe("getArtSalesExcelController", () => {
  it("returns 410 EXCEL_JOBS_MIGRATED", async () => {
    await assertMigratedExcelController(getArtSalesExcelController, "art-sales");
  });
});

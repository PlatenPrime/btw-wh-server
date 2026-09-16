import { describe, it } from "vitest";
import { assertMigratedExcelController } from "../../../../excel-jobs/test/assertMigratedExcelController.js";
import { getArtStockExcelController } from "../getArtStockExcelController.js";

describe("getArtStockExcelController", () => {
  it("returns 410 EXCEL_JOBS_MIGRATED", async () => {
    await assertMigratedExcelController(getArtStockExcelController, "art-stock");
  });
});

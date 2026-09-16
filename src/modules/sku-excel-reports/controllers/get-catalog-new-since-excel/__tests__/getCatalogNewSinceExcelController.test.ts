import { describe, it } from "vitest";
import { assertMigratedExcelController } from "../../../../excel-jobs/test/assertMigratedExcelController.js";
import { getCatalogNewSinceExcelController } from "../getCatalogNewSinceExcelController.js";

describe("getCatalogNewSinceExcelController", () => {
  it("returns 410 EXCEL_JOBS_MIGRATED", async () => {
    await assertMigratedExcelController(
      getCatalogNewSinceExcelController,
      "sku-catalog-new-since",
    );
  });
});

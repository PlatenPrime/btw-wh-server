import { describe, it } from "vitest";
import { assertMigratedExcelController } from "../../../../excel-jobs/test/assertMigratedExcelController.js";
import { getCatalogInvalidExcelController } from "../getCatalogInvalidExcelController.js";

describe("getCatalogInvalidExcelController", () => {
  it("returns 410 EXCEL_JOBS_MIGRATED", async () => {
    await assertMigratedExcelController(
      getCatalogInvalidExcelController,
      "sku-catalog-invalid",
    );
  });
});

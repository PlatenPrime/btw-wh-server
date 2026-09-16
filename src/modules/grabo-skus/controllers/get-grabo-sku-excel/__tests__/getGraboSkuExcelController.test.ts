import { describe, it } from "vitest";
import { assertMigratedExcelController } from "../../../../excel-jobs/test/assertMigratedExcelController.js";
import { getGraboSkuExcelController } from "../getGraboSkuExcelController.js";

describe("getGraboSkuExcelController", () => {
  it("returns 410 EXCEL_JOBS_MIGRATED", async () => {
    await assertMigratedExcelController(getGraboSkuExcelController, "grabo-skus");
  });
});

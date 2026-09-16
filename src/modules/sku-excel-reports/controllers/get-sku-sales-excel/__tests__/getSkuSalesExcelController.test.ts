import { describe, it } from "vitest";
import { assertMigratedExcelController } from "../../../../excel-jobs/test/assertMigratedExcelController.js";
import { getSkuSalesExcelController } from "../getSkuSalesExcelController.js";

describe("getSkuSalesExcelController", () => {
  it("returns 410 EXCEL_JOBS_MIGRATED", async () => {
    await assertMigratedExcelController(getSkuSalesExcelController, "sku-one-sales");
  });
});

import { describe, it } from "vitest";
import { assertMigratedExcelController } from "../../../../excel-jobs/test/assertMigratedExcelController.js";
import { getSkugrSalesExcelController } from "../getSkugrSalesExcelController.js";

describe("getSkugrSalesExcelController", () => {
  it("returns 410 EXCEL_JOBS_MIGRATED", async () => {
    await assertMigratedExcelController(
      getSkugrSalesExcelController,
      "sku-skugr-sales",
    );
  });
});

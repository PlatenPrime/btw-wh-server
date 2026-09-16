import { describe, it } from "vitest";
import { assertMigratedExcelController } from "../../../../excel-jobs/test/assertMigratedExcelController.js";
import { getSkuStockSliceExcelController } from "../getSkuSliceExcelController.js";

describe("getSkuStockSliceExcelController", () => {
  it("returns 410 EXCEL_JOBS_MIGRATED", async () => {
    await assertMigratedExcelController(
      getSkuStockSliceExcelController,
      "sku-one-stock",
    );
  });
});

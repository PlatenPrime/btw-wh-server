import { describe, it } from "vitest";
import { assertMigratedExcelController } from "../../../../excel-jobs/test/assertMigratedExcelController.js";
import { getSkugrSliceExcelController } from "../getSkugrSliceExcelController.js";

describe("getSkugrSliceExcelController", () => {
  it("returns 410 EXCEL_JOBS_MIGRATED", async () => {
    await assertMigratedExcelController(
      getSkugrSliceExcelController,
      "sku-skugr-stock",
    );
  });
});

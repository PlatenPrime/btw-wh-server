import { describe, it } from "vitest";
import { assertMigratedExcelController } from "../../../../excel-jobs/test/assertMigratedExcelController.js";
import { getKonkSkuStockSliceExcelController } from "../getKonkSkuSliceExcelController.js";

describe("getKonkSkuStockSliceExcelController", () => {
  it("returns 410 EXCEL_JOBS_MIGRATED", async () => {
    await assertMigratedExcelController(
      getKonkSkuStockSliceExcelController,
      "sku-konk-stock",
    );
  });
});

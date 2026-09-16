import { describe, it } from "vitest";
import { assertMigratedExcelController } from "../../../../excel-jobs/test/assertMigratedExcelController.js";
import { getKonkSkuSalesExcelController } from "../getKonkSkuSalesExcelController.js";

describe("getKonkSkuSalesExcelController", () => {
  it("returns 410 EXCEL_JOBS_MIGRATED", async () => {
    await assertMigratedExcelController(
      getKonkSkuSalesExcelController,
      "sku-konk-sales",
    );
  });
});

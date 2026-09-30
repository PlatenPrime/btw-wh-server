import { describe, it } from "vitest";
import { assertMigratedApiTaskController } from "../../../apitasks/test/assertMigratedApiTaskController.js";
import { fixIncorrectSkuDataController } from "../fix-incorrect-sku-data/fixIncorrectSkuDataController.js";

describe("fixIncorrectSkuDataController", () => {
  it("returns 410 API_TASKS_MIGRATED", async () => {
    await assertMigratedApiTaskController(
      fixIncorrectSkuDataController,
      "skus.fix-incorrect-sku-data",
    );
  });
});

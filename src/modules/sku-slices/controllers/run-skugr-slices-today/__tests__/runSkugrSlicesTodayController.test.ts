import { describe, it } from "vitest";
import { assertMigratedApiTaskController } from "../../../../apitasks/test/assertMigratedApiTaskController.js";
import { runSkugrSlicesTodayController } from "../runSkugrSlicesTodayController.js";

describe("runSkugrSlicesTodayController", () => {
  it("returns 410 API_TASKS_MIGRATED", async () => {
    await assertMigratedApiTaskController(
      runSkugrSlicesTodayController,
      "sku-slices.skugr-run-today",
    );
  });
});

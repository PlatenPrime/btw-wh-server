import { describe, it } from "vitest";
import { assertMigratedApiTaskController } from "../../../apitasks/test/assertMigratedApiTaskController.js";
import { updateAllBtradeStocksController } from "../update-all-btrade-stocks/updateAllBtradeStocksController.js";

describe("updateAllBtradeStocksController", () => {
  it("returns 410 API_TASKS_MIGRATED", async () => {
    await assertMigratedApiTaskController(
      updateAllBtradeStocksController,
      "arts.btrade-stock-update-all",
    );
  });
});

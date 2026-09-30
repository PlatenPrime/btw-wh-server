import { describe, it } from "vitest";
import { assertMigratedApiTaskController } from "../../../../apitasks/test/assertMigratedApiTaskController.js";
import { runGraboSkuSyncController } from "../runGraboSkuSyncController.js";

describe("runGraboSkuSyncController", () => {
  it("returns 410 API_TASKS_MIGRATED", async () => {
    await assertMigratedApiTaskController(
      runGraboSkuSyncController,
      "grabo-skus.sync",
    );
  });
});

import { describe, it } from "vitest";
import { assertMigratedApiTaskController } from "../../../../apitasks/test/assertMigratedApiTaskController.js";
import { fillSkugrSkusController } from "../fillSkugrSkusController.js";

describe("fillSkugrSkusController", () => {
  it("returns 410 API_TASKS_MIGRATED", async () => {
    await assertMigratedApiTaskController(
      fillSkugrSkusController,
      "skugrs.fill-skus",
    );
  });
});

import { describe, it } from "vitest";
import { assertMigratedApiTaskController } from "../../../../apitasks/test/assertMigratedApiTaskController.js";
import { deleteSkusNotInAnySkugrController } from "../deleteSkusNotInAnySkugrController.js";

describe("deleteSkusNotInAnySkugrController", () => {
  it("returns 410 API_TASKS_MIGRATED", async () => {
    await assertMigratedApiTaskController(
      deleteSkusNotInAnySkugrController,
      "skus.delete-not-in-any-skugr",
    );
  });
});

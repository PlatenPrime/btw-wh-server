import { describe, it } from "vitest";
import { assertMigratedApiTaskController } from "../../../apitasks/test/assertMigratedApiTaskController.js";
import { updateDelArtikulsByDelIdController } from "../update-del-artikuls-by-del-id/updateDelArtikulsByDelIdController.js";

describe("updateDelArtikulsByDelIdController", () => {
  it("returns 410 API_TASKS_MIGRATED", async () => {
    await assertMigratedApiTaskController(
      updateDelArtikulsByDelIdController,
      "dels.artikuls-update-all",
    );
  });
});

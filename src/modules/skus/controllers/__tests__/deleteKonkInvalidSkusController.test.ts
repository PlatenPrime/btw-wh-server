import { describe, it } from "vitest";
import { assertMigratedApiTaskController } from "../../../apitasks/test/assertMigratedApiTaskController.js";
import { deleteKonkInvalidSkusController } from "../delete-konk-invalid-skus/deleteKonkInvalidSkusController.js";

describe("deleteKonkInvalidSkusController", () => {
  it("returns 410 API_TASKS_MIGRATED", async () => {
    await assertMigratedApiTaskController(
      deleteKonkInvalidSkusController,
      "skus.delete-konk-invalid",
    );
  });
});

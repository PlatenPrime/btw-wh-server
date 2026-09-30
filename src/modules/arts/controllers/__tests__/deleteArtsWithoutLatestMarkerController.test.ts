import { describe, it } from "vitest";
import { assertMigratedApiTaskController } from "../../../apitasks/test/assertMigratedApiTaskController.js";
import { deleteArtsWithoutLatestMarkerController } from "../delete-arts-without-latest-marker/deleteArtsWithoutLatestMarkerController.js";

describe("deleteArtsWithoutLatestMarkerController", () => {
  it("returns 410 API_TASKS_MIGRATED", async () => {
    await assertMigratedApiTaskController(
      deleteArtsWithoutLatestMarkerController,
      "arts.delete-without-latest-marker",
    );
  });
});

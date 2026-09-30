import { describe, it } from "vitest";
import { assertMigratedApiTaskController } from "../../../apitasks/test/assertMigratedApiTaskController.js";
import { populateMissingPosData } from "../index.js";

describe("populateMissingPosData Controller", () => {
  it("returns 410 API_TASKS_MIGRATED", async () => {
    await assertMigratedApiTaskController(
      populateMissingPosData,
      "poses.populate-missing-data",
    );
  });
});

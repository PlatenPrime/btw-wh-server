import { describe, it } from "vitest";
import { assertMigratedApiTaskController } from "../../../../apitasks/test/assertMigratedApiTaskController.js";
import { recalculateZonesSectors } from "../recalculateZonesSectors.js";

describe("recalculateZonesSectorsController", () => {
  it("returns 410 API_TASKS_MIGRATED", async () => {
    await assertMigratedApiTaskController(
      recalculateZonesSectors,
      "blocks.recalculate-zones-sectors",
    );
  });
});

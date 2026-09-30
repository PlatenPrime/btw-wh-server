import { describe, it } from "vitest";
import { assertMigratedApiTaskController } from "../../../../apitasks/test/assertMigratedApiTaskController.js";
import { recalculatePalletsSectorsController } from "../recalculatePalletsSectorsController.js";

describe("recalculatePalletsSectorsController", () => {
  it("returns 410 API_TASKS_MIGRATED", async () => {
    await assertMigratedApiTaskController(
      recalculatePalletsSectorsController,
      "pallet-groups.recalculate-pallets-sectors",
    );
  });
});

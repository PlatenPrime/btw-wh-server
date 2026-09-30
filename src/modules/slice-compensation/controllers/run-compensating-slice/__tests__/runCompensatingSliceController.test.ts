import { describe, it } from "vitest";
import { assertMigratedApiTaskController } from "../../../../apitasks/test/assertMigratedApiTaskController.js";
import { runCompensatingSliceController } from "../runCompensatingSliceController.js";

describe("runCompensatingSliceController", () => {
  it("returns 410 API_TASKS_MIGRATED", async () => {
    await assertMigratedApiTaskController(
      runCompensatingSliceController,
      "slice-compensation.run",
    );
  });
});

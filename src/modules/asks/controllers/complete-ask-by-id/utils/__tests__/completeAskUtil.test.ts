import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../getCompleteAskActionUtil.js", () => ({
  getCompleteAskActionUtil: () => "2025-01-01 12:00 Solver: ВИКОНАВ запит",
}));

import { completeAskUtil } from "../completeAskUtil.js";
import { createTestAsk, createTestUser } from "../../../../../../test/setup.js";

describe("completeAskUtil", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("обновляет заявку: добавляет действие, ставит статус completed и solverData", async () => {
    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
      const ask = await createTestAsk({ actions: [], status: "new" });
      const solver = await createTestUser({ fullname: "Solver" });

      const updated = await completeAskUtil({
        solver,
        solverId: solver._id,
        ask,
        session,
      });

      expect(updated.status).toBe("completed");
      expect(updated.solverData?.fullname).toBe("Solver");
      expect(updated.solver?.toString()).toBe(String(solver._id));
      expect(updated.actions.at(-1)).toContain("ВИКОНАВ запит");
      expect(updated.events.at(-1)?.eventName).toBe("complete");
      expect(updated.events.at(-1)?.userData.fullname).toBe("Solver");
      expect(updated.pullBox).toBe(ask.pullBox);
      expect(updated.pullQuant).toBe(ask.pullQuant);
    });
    await session.endSession();
  });
});



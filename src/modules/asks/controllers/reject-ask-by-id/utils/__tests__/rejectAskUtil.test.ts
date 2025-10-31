import mongoose from "mongoose";
import { describe, expect, it, vi } from "vitest";

vi.mock("../getRejectAskActionUtil.js", () => ({
  getRejectAskActionUtil: () => "2025-01-01 12:00 Solver: ВІДХИЛИВ запит",
}));

import { rejectAskUtil } from "../rejectAskUtil.js";
import { createTestAsk, createTestUser } from "../../../../../../test/setup.js";

describe("rejectAskUtil", () => {
  it("обновляет заявку: статус rejected, добавляет действие и solverData", async () => {
    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
      const ask = await createTestAsk({ actions: [], status: "new" });
      const solver = await createTestUser({ fullname: "Solver" });

      const updated = await rejectAskUtil({
        solver,
        solverId: solver._id,
        ask,
        session,
      });

      expect(updated.status).toBe("rejected");
      expect(updated.solverData?.fullname).toBe("Solver");
      expect(updated.actions.at(-1)).toContain("ВІДХИЛИВ запит");
    });
    await session.endSession();
  });
});



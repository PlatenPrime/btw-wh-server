import mongoose from "mongoose";
import { describe, expect, it, vi } from "vitest";

vi.mock("../getUpdateAskActionUtil.js", () => ({
  getUpdateAskActionUtil: () => "2025-01-01 12:00 Solver: додав дію",
}));

import { createTestAsk, createTestUser } from "../../../../../../test/setup.js";
import { updateAskUtil } from "../updateAskUtil.js";

describe("updateAskUtil", () => {
  it("обновляет заявку: добавляет действие, при передаче status меняет статус", async () => {
    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
      const ask = await createTestAsk({ actions: [], status: "new" });
      const solver = await createTestUser({ fullname: "Solver" });

      const updated = await updateAskUtil({
        solver,
        solverId: solver._id,
        ask,
        action: "додав дію",
        status: "completed",
        session,
      });

      expect(updated.status).toBe("completed");
      expect(updated.solverData?.fullname).toBe("Solver");
      expect(updated.actions.at(-1)).toContain("додав дію");
      expect(updated.events.at(-1)?.eventName).toBe("complete");
      expect(updated.events.at(-1)?.userData.fullname).toBe("Solver");
      expect(updated.pullBox).toBe(ask.pullBox);
      expect(updated.pullQuant).toBe(ask.pullQuant);
    });
    await session.endSession();
  });

  it("добавляет pull событие и обновляет агрегаты", async () => {
    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
      const ask = await createTestAsk({ actions: [], status: "new" });
      const solver = await createTestUser({ fullname: "Solver" });
      const palletId = new mongoose.Types.ObjectId();

      const updated = await updateAskUtil({
        solver,
        solverId: solver._id,
        ask,
        action: "знято з палети",
        event: {
          eventName: "pull",
          pullDetails: {
            palletData: {
              _id: palletId.toString(),
              title: "PAL-1",
            },
            quant: 7,
            boxes: 3,
          },
        },
        session,
      });

      expect(updated.events.at(-1)?.eventName).toBe("pull");
      expect(updated.events.at(-1)?.userData.fullname).toBe("Solver");
      expect(updated.events.at(-1)?.pullDetails?.quant).toBe(7);
      expect(
        updated.events.at(-1)?.pullDetails?.palletData._id.toString()
      ).toBe(palletId.toString());
      expect(updated.pullQuant).toBe(7);
      expect(updated.pullBox).toBe(3);
      expect(updated.actions.at(-1)).toContain("знято з палети");
    });
    await session.endSession();
  });
});

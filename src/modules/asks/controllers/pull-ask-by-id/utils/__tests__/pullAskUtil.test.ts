import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../../../utils/getCurrentFormattedDateTime.js", () => ({
  getCurrentFormattedDateTime: () => "2025-01-01 12:00",
}));

import { pullAskUtil } from "../pullAskUtil.js";
import { mapUserToAskUserData } from "../../../../utils/askEventsUtil.js";
import {
  createTestAsk,
  createTestUser,
} from "../../../../../../test/setup.js";

describe("pullAskUtil", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("создает pull событие и агрегирует суммы", async () => {
    const solver = await createTestUser({
      fullname: "Solver User",
      username: `solver-${Date.now()}`,
    });

    const ask = await createTestAsk({
      pullQuant: 3,
      pullBox: 1,
      events: [
        {
          eventName: "pull",
          userData: mapUserToAskUserData(solver),
          date: new Date(),
          pullDetails: {
            palletData: {
              _id: new mongoose.Types.ObjectId(),
              title: "Pallet A",
            },
            quant: 3,
            boxes: 1,
          },
        },
      ],
    });

    const session = await mongoose.startSession();
    let updatedAsk: any = null;

    await session.withTransaction(async () => {
      updatedAsk = await pullAskUtil({
        solver,
        solverId: solver._id as mongoose.Types.ObjectId,
        ask,
        action: "Сняли товар",
        pullAskData: {
          palletData: {
            _id: new mongoose.Types.ObjectId().toString(),
            title: "Pallet B",
          },
          quant: 5,
          boxes: 2,
        },
        session,
      });
    });

    await session.endSession();

    expect(updatedAsk).toBeTruthy();
    expect(updatedAsk.pullQuant).toBe(8);
    expect(updatedAsk.pullBox).toBe(3);
    expect(updatedAsk.actions).toHaveLength(1);
    expect(updatedAsk.actions[0]).toContain("Solver User");
    expect(updatedAsk.events).toHaveLength(2);
    const latestEvent = updatedAsk.events[1];
    expect(latestEvent.eventName).toBe("pull");
    expect(latestEvent.pullDetails?.quant).toBe(5);
    expect(latestEvent.pullDetails?.boxes).toBe(2);
    expect(latestEvent.pullDetails?.palletData.title).toBe("Pallet B");
  });
});


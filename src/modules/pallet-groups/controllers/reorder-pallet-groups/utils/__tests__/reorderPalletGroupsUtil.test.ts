import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { PalletGroup } from "../../../../models/PalletGroup.js";
import { reorderPalletGroupsUtil } from "../reorderPalletGroupsUtil.js";

describe("reorderPalletGroupsUtil", () => {
  beforeEach(async () => {
    await PalletGroup.deleteMany({});
  });

  it("updates order of multiple groups in one transaction", async () => {
    const g1 = await PalletGroup.create({
      title: "Group A",
      order: 1,
      pallets: [],
    });
    const g2 = await PalletGroup.create({
      title: "Group B",
      order: 2,
      pallets: [],
    });
    const g3 = await PalletGroup.create({
      title: "Group C",
      order: 3,
      pallets: [],
    });

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const result = await reorderPalletGroupsUtil({
        orders: [
          { id: g1._id.toString(), order: 3 },
          { id: g2._id.toString(), order: 1 },
          { id: g3._id.toString(), order: 2 },
        ],
        session,
      });

      await session.commitTransaction();

      expect(result.updatedCount).toBe(3);
    } finally {
      session.endSession();
    }

    const after = await PalletGroup.find({}).sort({ order: 1 }).lean();
    expect(after).toHaveLength(3);
    expect(after[0].title).toBe("Group B");
    expect(after[0].order).toBe(1);
    expect(after[1].title).toBe("Group C");
    expect(after[1].order).toBe(2);
    expect(after[2].title).toBe("Group A");
    expect(after[2].order).toBe(3);
  });

  it("returns updatedCount only for groups whose order actually changed", async () => {
    const g1 = await PalletGroup.create({
      title: "Group A",
      order: 1,
      pallets: [],
    });
    const g2 = await PalletGroup.create({
      title: "Group B",
      order: 2,
      pallets: [],
    });

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const result = await reorderPalletGroupsUtil({
        orders: [
          { id: g1._id.toString(), order: 1 },
          { id: g2._id.toString(), order: 2 },
        ],
        session,
      });

      await session.commitTransaction();

      expect(result.updatedCount).toBe(0);
    } finally {
      session.endSession();
    }
  });

  it("throws when group id does not exist", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();

    const session = await mongoose.startSession();
    session.startTransaction();

    await expect(
      reorderPalletGroupsUtil({
        orders: [{ id: fakeId, order: 1 }],
        session,
      }),
    ).rejects.toThrow(/Pallet group not found/);

    await session.abortTransaction();
    session.endSession();
  });
});

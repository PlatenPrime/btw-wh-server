import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import "../../../../../../test/setup.js";
import { PalletGroup } from "../../../../models/PalletGroup.js";
import { updatePalletGroupUtil } from "../updatePalletGroupUtil.js";

describe("updatePalletGroupUtil", () => {
  beforeEach(async () => {
    await PalletGroup.deleteMany({});
  });

  it("updates title without changing order", async () => {
    const group = await PalletGroup.create({
      title: "Old Title",
      order: 1,
      pallets: [],
    });

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const result = await updatePalletGroupUtil({
        id: group._id.toString(),
        title: "New Title",
        session,
      });

      await session.commitTransaction();

      expect(result.title).toBe("New Title");
      expect(result.order).toBe(1);
    } finally {
      session.endSession();
    }
  });

  it("reorders group within list", async () => {
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
      await updatePalletGroupUtil({
        id: g2._id.toString(),
        order: 1,
        session,
      });

      await session.commitTransaction();
    } finally {
      session.endSession();
    }

    const after = await PalletGroup.find({}).sort({ order: 1 }).lean();
    expect(after[0].title).toBe("Group B");
    expect(after[1].title).toBe("Group A");
    expect(g1._id).toBeDefined();
  });

  it("throws when group not found", async () => {
    const session = await mongoose.startSession();
    session.startTransaction();

    await expect(
      updatePalletGroupUtil({
        id: new mongoose.Types.ObjectId().toString(),
        title: "X",
        session,
      }),
    ).rejects.toThrow("Pallet group not found");

    await session.abortTransaction();
    session.endSession();
  });
});

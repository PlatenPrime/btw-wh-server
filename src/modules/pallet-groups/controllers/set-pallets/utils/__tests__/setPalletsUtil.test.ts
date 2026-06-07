import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import "../../../../../../test/setup.js";
import { Pallet } from "../../../../../pallets/models/Pallet.js";
import { PalletGroup } from "../../../../models/PalletGroup.js";
import { setPalletsUtil } from "../setPalletsUtil.js";

const createPallet = async (title: string) => {
  const rowId = new mongoose.Types.ObjectId();
  return Pallet.create({
    title,
    row: rowId,
    rowData: { _id: rowId, title: "Row 1" },
    poses: [],
    isDef: false,
    sector: 0,
  });
};

describe("setPalletsUtil", () => {
  beforeEach(async () => {
    await Pallet.deleteMany({});
    await PalletGroup.deleteMany({});
  });

  it("assigns pallets to group", async () => {
    const pallet = await createPallet("P1");
    const group = await PalletGroup.create({
      title: "Group A",
      order: 1,
      pallets: [],
    });

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const result = await setPalletsUtil({
        groupId: group._id.toString(),
        palletIds: [pallet._id.toString()],
        session,
      });

      await session.commitTransaction();

      expect(result.pallets).toHaveLength(1);
      expect(result.pallets[0].toString()).toBe(pallet._id.toString());
    } finally {
      session.endSession();
    }
  });

  it("throws when pallet belongs to another group", async () => {
    const otherGroupId = new mongoose.Types.ObjectId();
    const pallet = await createPallet("P1");
    await Pallet.updateOne(
      { _id: pallet._id },
      { $set: { palgr: { id: otherGroupId, title: "Other" } } },
    );

    const group = await PalletGroup.create({
      title: "Group A",
      order: 1,
      pallets: [],
    });

    const session = await mongoose.startSession();
    session.startTransaction();

    await expect(
      setPalletsUtil({
        groupId: group._id.toString(),
        palletIds: [pallet._id.toString()],
        session,
      }),
    ).rejects.toThrow(/already belong to other groups/);

    await session.abortTransaction();
    session.endSession();
  });

  it("resets sector for removed pallets", async () => {
    const palletP1 = await createPallet("P1");
    const palletP2 = await createPallet("P2");
    const group = await PalletGroup.create({
      title: "Group A",
      order: 1,
      pallets: [palletP1._id, palletP2._id],
    });

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      await setPalletsUtil({
        groupId: group._id.toString(),
        palletIds: [palletP1._id.toString()],
        session,
      });

      await session.commitTransaction();
    } finally {
      session.endSession();
    }

    const removed = await Pallet.findById(palletP2._id).lean();
    expect(removed?.sector).toBe(0);
    expect(removed?.palgr).toBeUndefined();
  });
});

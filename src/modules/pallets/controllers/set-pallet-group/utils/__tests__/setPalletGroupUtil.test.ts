import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import "../../../../../../test/setup.js";
import { PalletGroup } from "../../../../../pallet-groups/models/PalletGroup.js";
import { Pallet } from "../../../../models/Pallet.js";
import { setPalletGroupUtil } from "../setPalletGroupUtil.js";

describe("setPalletGroupUtil", () => {
  beforeEach(async () => {
    await Pallet.deleteMany({});
    await PalletGroup.deleteMany({});
  });

  it("appends free pallet to target group end", async () => {
    const rowId = new mongoose.Types.ObjectId();
    const existing = await Pallet.create({
      title: "P-existing",
      row: rowId,
      rowData: { _id: rowId, title: "Row 1" },
      poses: [],
      isDef: false,
      sector: 101,
    });
    const pallet = await Pallet.create({
      title: "P-free",
      row: rowId,
      rowData: { _id: rowId, title: "Row 1" },
      poses: [],
      isDef: false,
      sector: 0,
    });
    const group = await PalletGroup.create({
      title: "Group A",
      order: 1,
      pallets: [existing._id],
    });

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const result = await setPalletGroupUtil({
        palletId: pallet._id.toString(),
        groupId: group._id.toString(),
        session,
      });

      await session.commitTransaction();

      expect(result.alreadyInGroup).toBe(false);
      expect(result.previousGroupId).toBeNull();
      expect(result.targetGroupId.equals(group._id)).toBe(true);
    } finally {
      session.endSession();
    }

    const updatedGroup = await PalletGroup.findById(group._id).lean();
    expect(updatedGroup?.pallets.map((id) => id.toString())).toEqual([
      existing._id.toString(),
      pallet._id.toString(),
    ]);
  });

  it("moves pallet from old group to end of new group", async () => {
    const rowId = new mongoose.Types.ObjectId();
    const pallet = await Pallet.create({
      title: "P-move",
      row: rowId,
      rowData: { _id: rowId, title: "Row 1" },
      poses: [],
      isDef: false,
      sector: 101,
    });
    const other = await Pallet.create({
      title: "P-other",
      row: rowId,
      rowData: { _id: rowId, title: "Row 1" },
      poses: [],
      isDef: false,
      sector: 201,
    });
    const oldGroup = await PalletGroup.create({
      title: "Old",
      order: 1,
      pallets: [pallet._id],
    });
    const newGroup = await PalletGroup.create({
      title: "New",
      order: 2,
      pallets: [other._id],
    });

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const result = await setPalletGroupUtil({
        palletId: pallet._id.toString(),
        groupId: newGroup._id.toString(),
        session,
      });

      await session.commitTransaction();

      expect(result.alreadyInGroup).toBe(false);
      expect(result.previousGroupId?.equals(oldGroup._id)).toBe(true);
      expect(result.targetGroupId.equals(newGroup._id)).toBe(true);
    } finally {
      session.endSession();
    }

    const updatedOld = await PalletGroup.findById(oldGroup._id).lean();
    const updatedNew = await PalletGroup.findById(newGroup._id).lean();
    expect(updatedOld?.pallets).toHaveLength(0);
    expect(updatedNew?.pallets.map((id) => id.toString())).toEqual([
      other._id.toString(),
      pallet._id.toString(),
    ]);
  });

  it("returns alreadyInGroup when pallet is already in target", async () => {
    const rowId = new mongoose.Types.ObjectId();
    const pallet = await Pallet.create({
      title: "P-same",
      row: rowId,
      rowData: { _id: rowId, title: "Row 1" },
      poses: [],
      isDef: false,
      sector: 101,
    });
    const group = await PalletGroup.create({
      title: "Group Same",
      order: 1,
      pallets: [pallet._id],
    });

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const result = await setPalletGroupUtil({
        palletId: pallet._id.toString(),
        groupId: group._id.toString(),
        session,
      });

      await session.commitTransaction();

      expect(result.alreadyInGroup).toBe(true);
      expect(result.previousGroupId?.equals(group._id)).toBe(true);
    } finally {
      session.endSession();
    }

    const updatedGroup = await PalletGroup.findById(group._id).lean();
    expect(updatedGroup?.pallets).toHaveLength(1);
  });

  it("throws when pallet not found", async () => {
    const group = await PalletGroup.create({
      title: "Group",
      order: 1,
      pallets: [],
    });

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      await expect(
        setPalletGroupUtil({
          palletId: new mongoose.Types.ObjectId().toString(),
          groupId: group._id.toString(),
          session,
        }),
      ).rejects.toThrow("Pallet not found");
      await session.abortTransaction();
    } finally {
      session.endSession();
    }
  });

  it("throws when group not found and does not mutate pallet groups", async () => {
    const rowId = new mongoose.Types.ObjectId();
    const pallet = await Pallet.create({
      title: "P-nogroup",
      row: rowId,
      rowData: { _id: rowId, title: "Row 1" },
      poses: [],
      isDef: false,
      sector: 0,
    });
    const oldGroup = await PalletGroup.create({
      title: "Keep",
      order: 1,
      pallets: [pallet._id],
    });

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      await expect(
        setPalletGroupUtil({
          palletId: pallet._id.toString(),
          groupId: new mongoose.Types.ObjectId().toString(),
          session,
        }),
      ).rejects.toThrow("Pallet group not found");
      await session.abortTransaction();
    } finally {
      session.endSession();
    }

    const unchanged = await PalletGroup.findById(oldGroup._id).lean();
    expect(unchanged?.pallets.map((id) => id.toString())).toEqual([pallet._id.toString()]);
  });
});

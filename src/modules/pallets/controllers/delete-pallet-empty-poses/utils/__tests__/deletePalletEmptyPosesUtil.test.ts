import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestPallet, createTestPos } from "../../../../../../test/utils/testHelpers.js";
import { Pallet } from "../../../../models/Pallet.js";
import { Pos } from "../../../../../poses/models/Pos.js";
import { deletePalletEmptyPosesUtil } from "../deletePalletEmptyPosesUtil.js";

describe("deletePalletEmptyPosesUtil", () => {
  beforeEach(async () => {
    // collections cleared in global setup
  });

  it("удаляет только пустые poses (quant=0, boxes=0)", async () => {
    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
      const pallet = await createTestPallet({ title: "Pallet-1" });
      const emptyPos1 = await createTestPos({
        pallet: pallet._id,
        palletData: {
          _id: pallet._id,
          title: pallet.title,
          sector: pallet.sector,
          isDef: pallet.isDef,
        },
        palletTitle: pallet.title,
        quant: 0,
        boxes: 0,
        artikul: "ART-EMPTY-1",
      });
      const emptyPos2 = await createTestPos({
        pallet: pallet._id,
        palletData: {
          _id: pallet._id,
          title: pallet.title,
          sector: pallet.sector,
          isDef: pallet.isDef,
        },
        palletTitle: pallet.title,
        quant: 0,
        boxes: 0,
        artikul: "ART-EMPTY-2",
      });
      const filledPos = await createTestPos({
        pallet: pallet._id,
        palletData: {
          _id: pallet._id,
          title: pallet.title,
          sector: pallet.sector,
          isDef: pallet.isDef,
        },
        palletTitle: pallet.title,
        quant: 10,
        boxes: 1,
        artikul: "ART-FILLED",
      });

      pallet.poses = [emptyPos1._id, emptyPos2._id, filledPos._id];
      await pallet.save({ session });

      const result = await deletePalletEmptyPosesUtil({
        palletId: String(pallet._id),
        session,
      });

      expect(result.deletedCount).toBe(2);
      expect(result.affectedPoseIds.length).toBe(2);

      const deletedEmpty1 = await Pos.findById(emptyPos1._id).session(
        session
      );
      const deletedEmpty2 = await Pos.findById(emptyPos2._id).session(
        session
      );
      const keptFilled = await Pos.findById(filledPos._id).session(session);

      expect(deletedEmpty1).toBeNull();
      expect(deletedEmpty2).toBeNull();
      expect(keptFilled).not.toBeNull();

      const updatedPallet = await Pallet.findById(pallet._id).session(session);
      expect(updatedPallet?.poses.length).toBe(1);
      expect(updatedPallet?.poses[0].toString()).toBe(
        String(filledPos._id)
      );
    });
    await session.endSession();
  });

  it("возвращает deletedCount=0 если пустых poses нет", async () => {
    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
      const pallet = await createTestPallet({ title: "Pallet-1" });
      const filledPos = await createTestPos({
        pallet: pallet._id,
        palletData: {
          _id: pallet._id,
          title: pallet.title,
          sector: pallet.sector,
          isDef: pallet.isDef,
        },
        palletTitle: pallet.title,
        quant: 10,
        boxes: 1,
      });

      pallet.poses = [filledPos._id];
      await pallet.save({ session });

      const result = await deletePalletEmptyPosesUtil({
        palletId: String(pallet._id),
        session,
      });

      expect(result.deletedCount).toBe(0);
      expect(result.affectedPoseIds.length).toBe(0);
    });
    await session.endSession();
  });

  it("выбрасывает ошибку если паллета не найдена", async () => {
    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
      await expect(
        deletePalletEmptyPosesUtil({
          palletId: new mongoose.Types.ObjectId().toString(),
          session,
        })
      ).rejects.toThrow("Pallet not found");
    });
    await session.endSession();
  });
});



import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestRow, createTestPallet, createTestPos } from "../../../../../../test/utils/testHelpers.js";
import { Pallet } from "../../../../models/Pallet.js";
import { Pos } from "../../../../../poses/models/Pos.js";
import { Row } from "../../../../../rows/models/Row.js";
import { deletePalletUtil } from "../deletePalletUtil.js";

describe("deletePalletUtil", () => {
  beforeEach(async () => {
    // collections cleared in global setup
  });

  it("удаляет паллету и связанные poses, обновляет Row", async () => {
    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
      const row = await createTestRow({ title: "Row 1" });
      const pallet = await createTestPallet({
        row: row._id,
        rowData: { _id: row._id, title: row.title },
      });

      const pos1 = await createTestPos({
        pallet: pallet._id,
        palletData: {
          _id: pallet._id,
          title: pallet.title,
          sector: pallet.sector,
          isDef: pallet.isDef,
        },
        palletTitle: pallet.title,
      });
      const pos2 = await createTestPos({
        pallet: pallet._id,
        palletData: {
          _id: pallet._id,
          title: pallet.title,
          sector: pallet.sector,
          isDef: pallet.isDef,
        },
        palletTitle: pallet.title,
      });

      pallet.poses = [pos1._id, pos2._id];
      await pallet.save({ session });

      row.pallets = [pallet._id];
      await row.save({ session });

      await deletePalletUtil({
        palletId: String(pallet._id),
        session,
      });

      const deletedPallet = await Pallet.findById(pallet._id).session(
        session
      );
      expect(deletedPallet).toBeNull();

      const deletedPos1 = await Pos.findById(pos1._id).session(session);
      const deletedPos2 = await Pos.findById(pos2._id).session(session);
      expect(deletedPos1).toBeNull();
      expect(deletedPos2).toBeNull();

      const updatedRow = await Row.findById(row._id).session(session);
      expect(updatedRow?.pallets).not.toContainEqual(pallet._id);
    });
    await session.endSession();
  });

  it("выбрасывает ошибку если паллета не найдена", async () => {
    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
      await expect(
        deletePalletUtil({
          palletId: new mongoose.Types.ObjectId().toString(),
          session,
        })
      ).rejects.toThrow("Pallet not found");
    });
    await session.endSession();
  });
});



import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import {
  createTestPallet,
  createTestPos,
  createTestRow,
} from "../../../../../../test/utils/testHelpers.js";
import { Pos } from "../../../../models/Pos.js";
import { updatePosUtil } from "../updatePosUtil.js";

describe("updatePosUtil", () => {
  beforeEach(async () => {
    // collections cleared in global setup
  });

  it("обновляет позицию в транзакции и возвращает обновлённый документ", async () => {
    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
      const row = await createTestRow();
      const pallet = await createTestPallet({
        row: { _id: row._id, title: row.title },
      });
      const pos = await createTestPos({
        pallet: { _id: pallet._id, title: pallet.title },
        row: { _id: row._id, title: row.title },
        artikul: "ART-OLD",
      });

      const result = await updatePosUtil({
        posId: pos._id.toString(),
        updateData: {
          artikul: "ART-NEW",
          quant: 20,
          nameukr: "Новое название",
        },
        session,
      });

      expect(result).toBeTruthy();
      expect(result.artikul).toBe("ART-NEW");
      expect(result.quant).toBe(20);
      expect(result.nameukr).toBe("Новое название");

      const found = await Pos.findById(pos._id).session(session);
      expect(found?.artikul).toBe("ART-NEW");
    });
    await session.endSession();
  });

  it("выбрасывает ошибку если позиция не найдена", async () => {
    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();

      await expect(
        updatePosUtil({
          posId: nonExistentId,
          updateData: { artikul: "ART-NEW" },
          session,
        })
      ).rejects.toThrow("Position not found");
    });
    await session.endSession();
  });
});


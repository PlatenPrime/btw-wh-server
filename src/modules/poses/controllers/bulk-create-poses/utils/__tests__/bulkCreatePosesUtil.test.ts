import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import {
  createTestPallet,
  createTestRow,
} from "../../../../../../test/utils/testHelpers.js";
import { Pos } from "../../../../models/Pos.js";
import { bulkCreatePosesUtil } from "../bulkCreatePosesUtil.js";

describe("bulkCreatePosesUtil", () => {
  beforeEach(async () => {
    // collections cleared in global setup
  });

  it("создаёт несколько позиций в транзакции", async () => {
    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
      const row = await createTestRow();
      const pallet = await createTestPallet({
        row: { _id: row._id, title: row.title },
      });

      const result = await bulkCreatePosesUtil({
        poses: [
          {
            palletId: pallet._id.toString(),
            rowId: row._id.toString(),
            artikul: "ART-1",
            quant: 10,
            boxes: 2,
          },
          {
            palletId: pallet._id.toString(),
            rowId: row._id.toString(),
            artikul: "ART-2",
            quant: 20,
            boxes: 4,
          },
        ],
        session,
      });

      expect(result.length).toBe(2);
      expect(result[0].artikul).toBe("ART-1");
      expect(result[1].artikul).toBe("ART-2");

      const found = await Pos.find({
        _id: { $in: result.map((p) => p._id) },
      }).session(session);
      expect(found.length).toBe(2);
    });
    await session.endSession();
  });

  it("выбрасывает ошибку если паллет не найден", async () => {
    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
      const row = await createTestRow();
      const nonExistentPalletId = new mongoose.Types.ObjectId().toString();

      await expect(
        bulkCreatePosesUtil({
          poses: [
            {
              palletId: nonExistentPalletId,
              rowId: row._id.toString(),
              artikul: "ART-1",
              quant: 10,
              boxes: 2,
            },
          ],
          session,
        })
      ).rejects.toThrow("Some pallets not found");
    });
    await session.endSession();
  });

  it("выбрасывает ошибку если ряд не найден", async () => {
    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
      const row = await createTestRow();
      const pallet = await createTestPallet({
        row: { _id: row._id, title: row.title },
      });
      const nonExistentRowId = new mongoose.Types.ObjectId().toString();

      await expect(
        bulkCreatePosesUtil({
          poses: [
            {
              palletId: pallet._id.toString(),
              rowId: nonExistentRowId,
              artikul: "ART-1",
              quant: 10,
              boxes: 2,
            },
          ],
          session,
        })
      ).rejects.toThrow("Some rows not found");
    });
    await session.endSession();
  });
});


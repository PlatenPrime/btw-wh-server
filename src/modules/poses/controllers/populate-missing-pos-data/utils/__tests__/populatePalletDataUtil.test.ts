import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import {
  createTestPallet,
  createTestPos,
  createTestRow,
} from "../../../../../../test/utils/testHelpers.js";
import { populatePalletDataUtil } from "../populatePalletDataUtil.js";

describe("populatePalletDataUtil", () => {
  beforeEach(async () => {
    // collections cleared in global setup
  });

  it("заполняет palletData для позиции", async () => {
    const row = await createTestRow();
    const pallet = await createTestPallet({
      row: { _id: row._id, title: row.title },
      title: "Test Pallet",
      sector: "A",
      isDef: false,
    });

    const pos = await createTestPos({
      pallet: { _id: pallet._id, title: pallet.title },
      row: { _id: row._id, title: row.title },
    });

    // Удаляем palletData для теста через прямое обновление MongoDB
    await pos.collection.updateOne(
      { _id: pos._id },
      { $unset: { palletData: "" } }
    );
    // Перезагружаем документ из базы без валидации
    const Pos = (await import("../../../../models/Pos.js")).Pos;
    const updatedPos = await Pos.findById(pos._id).lean();
    if (!updatedPos) throw new Error("Pos not found");
    pos.palletData = undefined as any;

    const result = await populatePalletDataUtil(pos);

    expect(result._id.toString()).toBe(pallet._id.toString());
    expect(pos.palletData).toBeDefined();
    expect(pos.palletData._id.toString()).toBe(pallet._id.toString());
    expect(pos.palletData.title).toBe("Test Pallet");
  });

  it("выбрасывает ошибку если паллет не найден", async () => {
    const row = await createTestRow();
    const fakePalletId = new mongoose.Types.ObjectId();
    const pos = await createTestPos({
      pallet: { _id: fakePalletId, title: "Non-existent" },
      row: { _id: row._id, title: row.title },
    });

    // Удаляем palletData через прямое обновление MongoDB
    await pos.collection.updateOne(
      { _id: pos._id },
      { $unset: { palletData: "" } }
    );
    // Перезагружаем документ
    const updatedDoc = await pos.collection.findOne({ _id: pos._id });
    if (updatedDoc) {
      pos.palletData = undefined as any;
      pos.pallet = fakePalletId;
    }

    await expect(populatePalletDataUtil(pos)).rejects.toThrow(
      "Pallet not found"
    );
  });
});


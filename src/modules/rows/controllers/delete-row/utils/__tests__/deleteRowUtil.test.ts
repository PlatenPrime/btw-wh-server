import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { Pallet } from "../../../../../pallets/models/Pallet.js";
import { Pos } from "../../../../../poses/models/Pos.js";
import { Row } from "../../../../models/Row.js";
import { deleteRowUtil } from "../deleteRowUtil.js";

describe("deleteRowUtil", () => {
  beforeEach(async () => {
    // collections cleared in global setup
  });

  it("удаляет ряд и возвращает true", async () => {
    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
      const row = await Row.create({ title: "To Delete" });

      const result = await deleteRowUtil({ id: row._id.toString(), session });

      expect(result).toBe(true);

      const deletedRow = await Row.findById(row._id).session(session);
      expect(deletedRow).toBeNull();
    });
    await session.endSession();
  });

  it("возвращает false если ряд не найден", async () => {
    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
      const nonExistentId = "000000000000000000000000";

      const result = await deleteRowUtil({ id: nonExistentId, session });

      expect(result).toBe(false);
    });
    await session.endSession();
  });

  it("каскадно удаляет связанные паллеты и позиции", async () => {
    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
      const row = await Row.create({ title: "Cascade Row" });
      const pallet = await Pallet.create({
        title: "Cascade Pallet",
        row: { _id: row._id, title: row.title },
        rowData: { _id: row._id, title: row.title },
        poses: [],
      });
      const pos = await Pos.create({
        pallet: { _id: pallet._id, title: pallet.title },
        row: { _id: row._id, title: row.title },
        palletData: { _id: pallet._id, title: pallet.title },
        rowData: { _id: row._id, title: row.title },
        palletTitle: pallet.title,
        rowTitle: row.title,
        artikul: "ART-CASCADE",
        quant: 10,
        boxes: 2,
      });

      const result = await deleteRowUtil({ id: row._id.toString(), session });

      expect(result).toBe(true);

      // Проверяем что всё было удалено
      const deletedRow = await Row.findById(row._id).session(session);
      const deletedPallet = await Pallet.findById(pallet._id).session(session);
      const deletedPos = await Pos.findById(pos._id).session(session);

      expect(deletedRow).toBeNull();
      expect(deletedPallet).toBeNull();
      expect(deletedPos).toBeNull();
    });
    await session.endSession();
  });

  it("каскадно удаляет несколько паллет и позиций", async () => {
    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
      const row = await Row.create({ title: "Multiple Cascade Row" });
      const pallet1 = await Pallet.create({
        title: "Pallet 1",
        row: { _id: row._id, title: row.title },
        rowData: { _id: row._id, title: row.title },
        poses: [],
      });
      const pallet2 = await Pallet.create({
        title: "Pallet 2",
        row: { _id: row._id, title: row.title },
        rowData: { _id: row._id, title: row.title },
        poses: [],
      });
      const pos1 = await Pos.create({
        pallet: { _id: pallet1._id, title: pallet1.title },
        row: { _id: row._id, title: row.title },
        palletData: { _id: pallet1._id, title: pallet1.title },
        rowData: { _id: row._id, title: row.title },
        palletTitle: pallet1.title,
        rowTitle: row.title,
        artikul: "ART-1",
        quant: 5,
        boxes: 1,
      });
      const pos2 = await Pos.create({
        pallet: { _id: pallet2._id, title: pallet2.title },
        row: { _id: row._id, title: row.title },
        palletData: { _id: pallet2._id, title: pallet2.title },
        rowData: { _id: row._id, title: row.title },
        palletTitle: pallet2.title,
        rowTitle: row.title,
        artikul: "ART-2",
        quant: 3,
        boxes: 1,
      });

      const result = await deleteRowUtil({ id: row._id.toString(), session });

      expect(result).toBe(true);

      // Проверяем что всё было удалено
      const deletedRow = await Row.findById(row._id).session(session);
      const deletedPallet1 = await Pallet.findById(pallet1._id).session(session);
      const deletedPallet2 = await Pallet.findById(pallet2._id).session(session);
      const deletedPos1 = await Pos.findById(pos1._id).session(session);
      const deletedPos2 = await Pos.findById(pos2._id).session(session);

      expect(deletedRow).toBeNull();
      expect(deletedPallet1).toBeNull();
      expect(deletedPallet2).toBeNull();
      expect(deletedPos1).toBeNull();
      expect(deletedPos2).toBeNull();
    });
    await session.endSession();
  });
});


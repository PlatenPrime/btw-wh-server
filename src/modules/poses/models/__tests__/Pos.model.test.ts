import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import "../../../../test/setup.js";
import { Pos } from "../Pos.js";

const createValidPosData = () => {
  const palletId = new mongoose.Types.ObjectId();
  const rowId = new mongoose.Types.ObjectId();

  return {
    pallet: palletId,
    row: rowId,
    palletData: {
      _id: palletId,
      title: "Pallet 1",
      sector: 1,
      isDef: false,
    },
    rowData: {
      _id: rowId,
      title: "Row 1",
    },
    palletTitle: "Pallet 1",
    rowTitle: "Row 1",
    artikul: "ART-001",
    quant: 10,
    boxes: 2,
    comment: "",
  };
};

describe("Pos Model", () => {
  beforeEach(async () => {
    await Pos.deleteMany({});
  });

  describe("Schema Validation", () => {
    it("should fail without required artikul", async () => {
      const data = createValidPosData();
      delete (data as { artikul?: string }).artikul;

      const pos = new Pos(data);
      await expect(pos.save()).rejects.toThrow();
    });

    it("should fail without required quant", async () => {
      const data = createValidPosData();
      delete (data as { quant?: number }).quant;

      const pos = new Pos(data);
      await expect(pos.save()).rejects.toThrow();
    });

    it("should fail when palletData sector is negative", async () => {
      const data = createValidPosData();
      data.palletData.sector = -1;

      const pos = new Pos(data);
      await expect(pos.save()).rejects.toThrow();
    });

    it("should save with all required fields", async () => {
      const saved = await Pos.create(createValidPosData());

      expect(saved.artikul).toBe("ART-001");
      expect(saved.quant).toBe(10);
      expect(saved.boxes).toBe(2);
      expect(saved.palletTitle).toBe("Pallet 1");
      expect(saved.rowTitle).toBe("Row 1");
      expect(saved.palletData.isDef).toBe(false);
      expect(saved.createdAt).toBeInstanceOf(Date);
      expect(saved.updatedAt).toBeInstanceOf(Date);
    });

    it("should accept optional sklad and nameukr", async () => {
      const saved = await Pos.create({
        ...createValidPosData(),
        sklad: "merezhi",
        nameukr: "Товар",
      });

      expect(saved.sklad).toBe("merezhi");
      expect(saved.nameukr).toBe("Товар");
    });
  });
});

import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestPos } from "../../../../test/setup.js";
import { Pos } from "../../models/Pos.js";
import { getPogrebiDefStocks } from "../getPogrebiDefStocks.js";

describe("getPogrebiDefStocks", () => {
  beforeEach(async () => {
    await Pos.deleteMany({});
  });

  it("returns merged stocks for pogrebi def positions with non-zero quant", async () => {
    await createTestPos({
      artikul: "ART-001",
      nameukr: "Товар 1",
      quant: 10,
      boxes: 2,
      sklad: "pogrebi",
      palletData: {
        _id: new mongoose.Types.ObjectId(),
        title: "P1",
        isDef: true,
      },
    });
    await createTestPos({
      artikul: "ART-001",
      nameukr: "Товар 1",
      quant: 5,
      boxes: 1,
      sklad: "pogrebi",
      palletData: {
        _id: new mongoose.Types.ObjectId(),
        title: "P2",
        isDef: true,
      },
    });
    await createTestPos({
      artikul: "ART-002",
      nameukr: "",
      quant: 3,
      boxes: 1,
      sklad: "pogrebi",
      palletData: {
        _id: new mongoose.Types.ObjectId(),
        title: "P3",
        isDef: true,
      },
    });

    const result = await getPogrebiDefStocks();

    expect(result).toEqual({
      "ART-001": { nameukr: "Товар 1", quant: 15, boxes: 3 },
      "ART-002": { nameukr: "", quant: 3, boxes: 1 },
    });
  });

  it("excludes zero quant and non-def positions", async () => {
    await createTestPos({
      artikul: "ART-ZERO",
      quant: 0,
      sklad: "pogrebi",
      palletData: {
        _id: new mongoose.Types.ObjectId(),
        title: "P1",
        isDef: true,
      },
    });
    await createTestPos({
      artikul: "ART-NODEF",
      quant: 10,
      sklad: "pogrebi",
      palletData: {
        _id: new mongoose.Types.ObjectId(),
        title: "P2",
        isDef: false,
      },
    });
    await createTestPos({
      artikul: "ART-OTHER",
      quant: 7,
      sklad: "merezhi",
      palletData: {
        _id: new mongoose.Types.ObjectId(),
        title: "P3",
        isDef: true,
      },
    });

    const result = await getPogrebiDefStocks();

    expect(result).toEqual({});
  });
});

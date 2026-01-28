import mongoose from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { IPallet, Pallet } from "../../pallets/models/Pallet.js";
import { IPos, Pos } from "../../poses/models/Pos.js";
import { IPalletGroup, PalletGroup } from "../models/PalletGroup.js";
import { calculatePalletsSectorsUtil } from "../utils/calculatePalletsSectorsUtil.js";

describe("calculatePalletsSectorsUtil", () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect("mongodb://127.0.0.1:27017/btw-wh-server-test");
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("should assign sectors based on group order and pallet index", async () => {
    await Pos.deleteMany({});
    await Pallet.deleteMany({});
    await PalletGroup.deleteMany({});

    const palletA = await Pallet.create({
      title: "Pallet A",
      row: new mongoose.Types.ObjectId(),
      rowData: { _id: new mongoose.Types.ObjectId(), title: "Row 1" },
      poses: [],
      isDef: false,
      sector: 0,
    } as Partial<IPallet>);

    const palletB = await Pallet.create({
      title: "Pallet B",
      row: new mongoose.Types.ObjectId(),
      rowData: { _id: new mongoose.Types.ObjectId(), title: "Row 1" },
      poses: [],
      isDef: false,
      sector: 0,
    } as Partial<IPallet>);

    const group1 = await PalletGroup.create({
      title: "Group 1",
      order: 1,
      pallets: [palletA._id, palletB._id],
    } as Partial<IPalletGroup>);

    // create positions bound to pallets to verify palletData.sector sync
    const posOnA = await Pos.create({
      pallet: palletA._id,
      row: palletA.row,
      palletData: {
        _id: palletA._id,
        title: palletA.title,
        sector: 0,
        isDef: false,
      },
      rowData: {
        _id: palletA.rowData._id,
        title: palletA.rowData.title,
      },
      palletTitle: palletA.title,
      rowTitle: palletA.rowData.title,
      artikul: "ART-1",
      quant: 10,
      boxes: 1,
      comment: "",
    } as Partial<IPos>);

    const posOnB = await Pos.create({
      pallet: palletB._id,
      row: palletB.row,
      palletData: {
        _id: palletB._id,
        title: palletB.title,
        sector: 0,
        isDef: false,
      },
      rowData: {
        _id: palletB.rowData._id,
        title: palletB.rowData.title,
      },
      palletTitle: palletB.title,
      rowTitle: palletB.rowData.title,
      artikul: "ART-2",
      quant: 5,
      boxes: 1,
      comment: "",
    } as Partial<IPos>);

    const result = await calculatePalletsSectorsUtil();

    expect(result.groupsProcessed).toBe(1);
    expect(result.updatedPallets).toBeGreaterThanOrEqual(2);

    const updatedA = await Pallet.findById(palletA._id).exec();
    const updatedB = await Pallet.findById(palletB._id).exec();

    expect(updatedA?.sector).toBe(101);
    expect(updatedB?.sector).toBe(102);

    const updatedPosOnA = await Pos.findById(posOnA._id).exec();
    const updatedPosOnB = await Pos.findById(posOnB._id).exec();

    expect(updatedPosOnA?.palletData.sector).toBe(101);
    expect(updatedPosOnB?.palletData.sector).toBe(102);

    expect(result.updatedPositions).toBeGreaterThanOrEqual(2);
  });
});

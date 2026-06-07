import { Request, Response } from "express";
import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import "../../../../../test/setup.js";
import { Pallet } from "../../../../pallets/models/Pallet.js";
import { PalletGroup } from "../../../models/PalletGroup.js";
import { unlinkPalletController } from "../unlinkPalletController.js";

describe("unlinkPalletController", () => {
  let res: Response;
  let responseJson: Record<string, unknown>;
  let responseStatus: { code?: number };

  beforeEach(() => {
    responseJson = {};
    responseStatus = {};
    res = {
      status(code: number) {
        responseStatus.code = code;
        return this;
      },
      json(data: Record<string, unknown>) {
        responseJson = data;
        return this;
      },
    } as unknown as Response;
  });

  it("200: unlinks pallet from group", async () => {
    const rowId = new mongoose.Types.ObjectId();
    const pallet = await Pallet.create({
      title: "P1",
      row: rowId,
      rowData: { _id: rowId, title: "Row 1" },
      poses: [],
      isDef: false,
      sector: 101,
    });
    const group = await PalletGroup.create({
      title: "Group A",
      order: 1,
      pallets: [pallet._id],
    });

    const req = {
      body: { palletId: pallet._id.toString() },
    } as unknown as Request;

    await unlinkPalletController(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.message).toBe("Pallet unlinked from group successfully");

    const data = responseJson.data as { pallets: unknown[] };
    expect(data.pallets).toHaveLength(0);

    const updatedGroup = await PalletGroup.findById(group._id).lean();
    expect(updatedGroup?.pallets).toHaveLength(0);
  });

  it("404: pallet is not linked to any group", async () => {
    const rowId = new mongoose.Types.ObjectId();
    const pallet = await Pallet.create({
      title: "P1",
      row: rowId,
      rowData: { _id: rowId, title: "Row 1" },
      poses: [],
      isDef: false,
      sector: 0,
    });

    const req = {
      body: { palletId: pallet._id.toString() },
    } as unknown as Request;

    await unlinkPalletController(req, res);

    expect(responseStatus.code).toBe(404);
    expect(responseJson.message).toBe("Pallet is not linked to any group");
  });

  it("400: validation error for invalid pallet id", async () => {
    const req = { body: { palletId: "bad-id" } } as unknown as Request;

    await unlinkPalletController(req, res);

    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Invalid data");
  });
});

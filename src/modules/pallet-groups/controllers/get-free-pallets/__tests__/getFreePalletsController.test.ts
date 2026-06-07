import { Request, Response } from "express";
import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import "../../../../../test/setup.js";
import { Pallet } from "../../../../pallets/models/Pallet.js";
import { PalletGroup } from "../../../models/PalletGroup.js";
import { getFreePalletsController } from "../getFreePalletsController.js";

const createPallet = async (title: string) => {
  const rowId = new mongoose.Types.ObjectId();
  return Pallet.create({
    title,
    row: rowId,
    rowData: { _id: rowId, title: "Row 1" },
    poses: [],
    isDef: false,
    sector: 0,
  });
};

describe("getFreePalletsController", () => {
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

  it("200: returns free pallets as PalletShortDto[]", async () => {
    const palletP1 = await createPallet("P1");
    await createPallet("P2");

    await PalletGroup.create({
      title: "Group 1",
      order: 1,
      pallets: [palletP1._id],
    });

    const req = {} as Request;
    await getFreePalletsController(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.message).toBe("Free pallets fetched successfully");

    const data = responseJson.data as Array<{ title: string }>;
    expect(data).toHaveLength(1);
    expect(data[0].title).toBe("P2");
    expect(data[0]).toHaveProperty("id");
    expect(data[0]).toHaveProperty("sector");
    expect(data[0]).toHaveProperty("isDef");
    expect(data[0]).toHaveProperty("isEmpty");
  });

  it("200: returns empty array when all pallets are in groups", async () => {
    const pallet = await createPallet("P1");
    await PalletGroup.create({
      title: "Group 1",
      order: 1,
      pallets: [pallet._id],
    });

    const req = {} as Request;
    await getFreePalletsController(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.data).toEqual([]);
  });
});

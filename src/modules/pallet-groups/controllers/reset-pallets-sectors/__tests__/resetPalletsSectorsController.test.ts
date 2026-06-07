import { Request, Response } from "express";
import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import "../../../../../test/setup.js";
import { Pallet } from "../../../../pallets/models/Pallet.js";
import { resetPalletsSectorsController } from "../resetPalletsSectorsController.js";

describe("resetPalletsSectorsController", () => {
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

  it("200: resets all pallet sectors to 0", async () => {
    const rowId = new mongoose.Types.ObjectId();
    await Pallet.create({
      title: "P1",
      row: rowId,
      rowData: { _id: rowId, title: "Row 1" },
      poses: [],
      isDef: false,
      sector: 101,
      palgr: { id: new mongoose.Types.ObjectId(), title: "Group" },
    });

    const req = {} as Request;
    await resetPalletsSectorsController(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.message).toBe("Pallets sectors reset successfully");
    expect((responseJson.data as { modifiedCount: number }).modifiedCount).toBe(1);

    const pallet = await Pallet.findOne({ title: "P1" }).lean();
    expect(pallet?.sector).toBe(0);
    expect(pallet?.palgr).toBeUndefined();
  });
});

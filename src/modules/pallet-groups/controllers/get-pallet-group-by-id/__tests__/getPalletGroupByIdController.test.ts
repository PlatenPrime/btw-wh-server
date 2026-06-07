import { Request, Response } from "express";
import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import "../../../../../test/setup.js";
import { Pallet } from "../../../../pallets/models/Pallet.js";
import { PalletGroup } from "../../../models/PalletGroup.js";
import { getPalletGroupByIdController } from "../getPalletGroupByIdController.js";

describe("getPalletGroupByIdController", () => {
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

  it("200: returns group with pallet short DTOs", async () => {
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
      params: { id: group._id.toString() },
    } as unknown as Request;

    await getPalletGroupByIdController(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.message).toBe("Pallet group fetched successfully");

    const data = responseJson.data as {
      title: string;
      pallets: Array<{ title: string; id: string }>;
    };
    expect(data.title).toBe("Group A");
    expect(data.pallets).toHaveLength(1);
    expect(data.pallets[0].title).toBe("P1");
    expect(data.pallets[0].id).toBe(pallet._id.toString());
  });

  it("400: invalid id format", async () => {
    const req = { params: { id: "bad-id" } } as unknown as Request;

    await getPalletGroupByIdController(req, res);

    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Invalid pallet group id");
  });

  it("404: group not found", async () => {
    const req = {
      params: { id: new mongoose.Types.ObjectId().toString() },
    } as unknown as Request;

    await getPalletGroupByIdController(req, res);

    expect(responseStatus.code).toBe(404);
    expect(responseJson.message).toBe("Pallet group not found");
  });
});

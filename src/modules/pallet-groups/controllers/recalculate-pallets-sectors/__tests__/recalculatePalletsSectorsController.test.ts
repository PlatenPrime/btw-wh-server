import { Request, Response } from "express";
import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestUser } from "../../../../../test/setup.js";
import { Event } from "../../../../events/models/Event.js";
import { Pallet } from "../../../../pallets/models/Pallet.js";
import { PalletGroup } from "../../../models/PalletGroup.js";
import { recalculatePalletsSectorsController } from "../recalculatePalletsSectorsController.js";

describe("recalculatePalletsSectorsController", () => {
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

  it("200: recalculates pallet sectors", async () => {
    const rowId = new mongoose.Types.ObjectId();
    const pallet = await Pallet.create({
      title: "P1",
      row: rowId,
      rowData: { _id: rowId, title: "Row 1" },
      poses: [],
      isDef: false,
      sector: 0,
    });

    await PalletGroup.create({
      title: "Group 1",
      order: 1,
      pallets: [pallet._id],
    });

    const req = {} as Request;
    await recalculatePalletsSectorsController(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.message).toBe("Pallets sectors recalculated successfully");

    const data = responseJson.data as {
      groupsProcessed: number;
      updatedPallets: number;
    };
    expect(data.groupsProcessed).toBe(1);
    expect(data.updatedPallets).toBeGreaterThanOrEqual(1);

    const updated = await Pallet.findById(pallet._id).lean();
    expect(updated?.sector).toBe(101);
  });

  it("200: creates audit event when req.user is present", async () => {
    const rowId = new mongoose.Types.ObjectId();
    const pallet = await Pallet.create({
      title: "P-Event",
      row: rowId,
      rowData: { _id: rowId, title: "Row 1" },
      poses: [],
      isDef: false,
      sector: 0,
    });
    await PalletGroup.create({
      title: "Group Event",
      order: 1,
      pallets: [pallet._id],
    });
    const user = await createTestUser({
      username: `recalc-sectors-event-${Date.now()}`,
    });

    const req = { user: { id: user._id.toString(), role: "ADMIN" } } as unknown as Request;
    await recalculatePalletsSectorsController(req, res);

    expect(responseStatus.code).toBe(200);
    const events = await Event.find({ department: "pallet-groups" });
    expect(events).toHaveLength(1);
  });
});

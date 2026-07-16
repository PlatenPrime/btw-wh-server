import { Request, Response } from "express";
import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestUser } from "../../../../../test/setup.js";
import { Event } from "../../../../events/models/Event.js";
import { Pallet } from "../../../../pallets/models/Pallet.js";
import { PalletGroup } from "../../../models/PalletGroup.js";
import { deletePalletGroupController } from "../deletePalletGroupController.js";

const createPallet = async (title: string) => {
  const rowId = new mongoose.Types.ObjectId();
  return Pallet.create({
    title,
    row: rowId,
    rowData: { _id: rowId, title: "Row 1" },
    poses: [],
    isDef: false,
    sector: 101,
    palgr: { id: new mongoose.Types.ObjectId(), title: "Group" },
  });
};

describe("deletePalletGroupController", () => {
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

  it("200: deletes group and resets pallet sectors", async () => {
    const pallet = await createPallet("P1");
    const group = await PalletGroup.create({
      title: "Group A",
      order: 1,
      pallets: [pallet._id],
    });
    await PalletGroup.create({ title: "Group B", order: 2, pallets: [] });

    const req = {
      params: { id: group._id.toString() },
    } as unknown as Request;

    await deletePalletGroupController(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.message).toBe("Pallet group deleted successfully");

    const deleted = await PalletGroup.findById(group._id);
    expect(deleted).toBeNull();

    const updatedPallet = await Pallet.findById(pallet._id).lean();
    expect(updatedPallet?.sector).toBe(0);
    expect(updatedPallet?.palgr).toBeUndefined();

    const remaining = await PalletGroup.find({}).sort({ order: 1 }).lean();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].title).toBe("Group B");
    expect(remaining[0].order).toBe(1);
  });

  it("200: creates audit event when req.user is present", async () => {
    const pallet = await createPallet("P-Event");
    const group = await PalletGroup.create({
      title: "Group Event",
      order: 1,
      pallets: [pallet._id],
    });
    const user = await createTestUser({
      username: `delete-pallet-group-event-${Date.now()}`,
    });

    const req = {
      user: { id: user._id.toString(), role: "PRIME" },
      params: { id: group._id.toString() },
    } as unknown as Request;

    await deletePalletGroupController(req, res);

    expect(responseStatus.code).toBe(200);
    const events = await Event.find({ department: "pallet-groups" });
    expect(events).toHaveLength(1);
    expect(events[0].description).toContain("Group Event");
  });

  it("400: invalid id format", async () => {
    const req = { params: { id: "invalid-id" } } as unknown as Request;

    await deletePalletGroupController(req, res);

    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Invalid pallet group id");
  });

  it("404: group not found", async () => {
    const req = {
      params: { id: new mongoose.Types.ObjectId().toString() },
    } as unknown as Request;

    await deletePalletGroupController(req, res);

    expect(responseStatus.code).toBe(404);
    expect(responseJson.message).toBe("Pallet group not found");
  });
});

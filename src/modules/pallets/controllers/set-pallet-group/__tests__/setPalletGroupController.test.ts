import { Request, Response } from "express";
import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestUser } from "../../../../../test/setup.js";
import { Event } from "../../../../events/models/Event.js";
import { PalletGroup } from "../../../../pallet-groups/models/PalletGroup.js";
import { Pallet } from "../../../models/Pallet.js";
import { setPalletGroupController } from "../setPalletGroupController.js";

describe("setPalletGroupController", () => {
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

  it("200: assigns free pallet to group and recalculates sector", async () => {
    const rowId = new mongoose.Types.ObjectId();
    const pallet = await Pallet.create({
      title: "P-assign",
      row: rowId,
      rowData: { _id: rowId, title: "Row 1" },
      poses: [],
      isDef: false,
      sector: 0,
    });
    const group = await PalletGroup.create({
      title: "Group A",
      order: 1,
      pallets: [],
    });

    const req = {
      params: { id: pallet._id.toString() },
      body: { groupId: group._id.toString() },
    } as unknown as Request;

    await setPalletGroupController(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.message).toBe("Pallet group updated successfully");

    const data = responseJson.data as {
      sector: number;
      palgr?: { id: mongoose.Types.ObjectId; title: string };
    };
    expect(data.sector).toBe(101);
    expect(data.palgr?.title).toBe("Group A");
    expect(data.palgr?.id.toString()).toBe(group._id.toString());

    const updatedGroup = await PalletGroup.findById(group._id).lean();
    expect(updatedGroup?.pallets).toHaveLength(1);
  });

  it("200: moves pallet between groups and recalculates both", async () => {
    const rowId = new mongoose.Types.ObjectId();
    const pallet = await Pallet.create({
      title: "P-move-ctrl",
      row: rowId,
      rowData: { _id: rowId, title: "Row 1" },
      poses: [],
      isDef: false,
      sector: 101,
    });
    const stay = await Pallet.create({
      title: "P-stay",
      row: rowId,
      rowData: { _id: rowId, title: "Row 1" },
      poses: [],
      isDef: false,
      sector: 102,
    });
    const oldGroup = await PalletGroup.create({
      title: "Old G",
      order: 1,
      pallets: [pallet._id, stay._id],
    });
    const newGroup = await PalletGroup.create({
      title: "New G",
      order: 2,
      pallets: [],
    });

    const req = {
      params: { id: pallet._id.toString() },
      body: { groupId: newGroup._id.toString() },
    } as unknown as Request;

    await setPalletGroupController(req, res);

    expect(responseStatus.code).toBe(200);

    const moved = await Pallet.findById(pallet._id).lean();
    const stayed = await Pallet.findById(stay._id).lean();
    expect(moved?.palgr?.title).toBe("New G");
    expect(moved?.sector).toBe(201);
    expect(stayed?.sector).toBe(101);
    expect(stayed?.palgr?.title).toBe("Old G");

    const updatedOld = await PalletGroup.findById(oldGroup._id).lean();
    expect(updatedOld?.pallets.map((id) => id.toString())).toEqual([stay._id.toString()]);
  });

  it("200: idempotent when already in group", async () => {
    const rowId = new mongoose.Types.ObjectId();
    const pallet = await Pallet.create({
      title: "P-idem",
      row: rowId,
      rowData: { _id: rowId, title: "Row 1" },
      poses: [],
      isDef: false,
      sector: 101,
      palgr: { id: new mongoose.Types.ObjectId(), title: "tmp" },
    });
    const group = await PalletGroup.create({
      title: "Same",
      order: 1,
      pallets: [pallet._id],
    });
    await Pallet.findByIdAndUpdate(pallet._id, {
      palgr: { id: group._id, title: group.title },
      sector: 101,
    });

    const req = {
      params: { id: pallet._id.toString() },
      body: { groupId: group._id.toString() },
    } as unknown as Request;

    await setPalletGroupController(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.message).toBe("Pallet already belongs to this group");
  });

  it("200: creates audit event when req.user is present", async () => {
    const rowId = new mongoose.Types.ObjectId();
    const pallet = await Pallet.create({
      title: "P-event",
      row: rowId,
      rowData: { _id: rowId, title: "Row 1" },
      poses: [],
      isDef: false,
      sector: 0,
    });
    const group = await PalletGroup.create({
      title: "Event G",
      order: 1,
      pallets: [],
    });
    const user = await createTestUser({
      username: `set-pallet-group-event-${Date.now()}`,
    });

    const req = {
      user: { id: user._id.toString(), role: "ADMIN" },
      params: { id: pallet._id.toString() },
      body: { groupId: group._id.toString() },
    } as unknown as Request;

    await setPalletGroupController(req, res);

    expect(responseStatus.code).toBe(200);
    const events = await Event.find({ department: "pallets" });
    expect(events).toHaveLength(1);
    expect(events[0].description).toContain("P-event");
  });

  it("400: invalid groupId does not mutate", async () => {
    const rowId = new mongoose.Types.ObjectId();
    const pallet = await Pallet.create({
      title: "P-invalid",
      row: rowId,
      rowData: { _id: rowId, title: "Row 1" },
      poses: [],
      isDef: false,
      sector: 0,
    });
    const group = await PalletGroup.create({
      title: "Untouched",
      order: 1,
      pallets: [],
    });

    const req = {
      params: { id: pallet._id.toString() },
      body: { groupId: "not-an-object-id" },
    } as unknown as Request;

    await setPalletGroupController(req, res);

    expect(responseStatus.code).toBe(400);
    const untouched = await PalletGroup.findById(group._id).lean();
    expect(untouched?.pallets).toHaveLength(0);
  });

  it("404: group not found does not mutate", async () => {
    const rowId = new mongoose.Types.ObjectId();
    const pallet = await Pallet.create({
      title: "P-404-group",
      row: rowId,
      rowData: { _id: rowId, title: "Row 1" },
      poses: [],
      isDef: false,
      sector: 0,
    });
    const group = await PalletGroup.create({
      title: "Keep empty",
      order: 1,
      pallets: [],
    });

    const req = {
      params: { id: pallet._id.toString() },
      body: { groupId: new mongoose.Types.ObjectId().toString() },
    } as unknown as Request;

    await setPalletGroupController(req, res);

    expect(responseStatus.code).toBe(404);
    expect(responseJson.message).toBe("Pallet group not found");
    const untouched = await PalletGroup.findById(group._id).lean();
    expect(untouched?.pallets).toHaveLength(0);
  });

  it("404: pallet not found", async () => {
    const group = await PalletGroup.create({
      title: "G",
      order: 1,
      pallets: [],
    });

    const req = {
      params: { id: new mongoose.Types.ObjectId().toString() },
      body: { groupId: group._id.toString() },
    } as unknown as Request;

    await setPalletGroupController(req, res);

    expect(responseStatus.code).toBe(404);
    expect(responseJson.message).toBe("Pallet not found");
  });
});

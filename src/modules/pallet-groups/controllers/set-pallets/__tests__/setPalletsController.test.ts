import { Request, Response } from "express";
import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestUser } from "../../../../../test/setup.js";
import { Event } from "../../../../events/models/Event.js";
import { Pallet } from "../../../../pallets/models/Pallet.js";
import { PalletGroup } from "../../../models/PalletGroup.js";
import { setPalletsController } from "../setPalletsController.js";

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

describe("setPalletsController", () => {
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

  it("200: sets pallets for group and recalculates sectors", async () => {
    const pallet = await createPallet("P1");
    const group = await PalletGroup.create({
      title: "Group A",
      order: 1,
      pallets: [],
    });

    const req = {
      body: {
        groupId: group._id.toString(),
        palletIds: [pallet._id.toString()],
      },
    } as unknown as Request;

    await setPalletsController(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.message).toBe("Pallets set for group successfully");

    const data = responseJson.data as {
      pallets: Array<{ title: string; sector: number }>;
    };
    expect(data.pallets).toHaveLength(1);
    expect(data.pallets[0].title).toBe("P1");
    expect(data.pallets[0].sector).toBe(101);
  });

  it("200: creates audit event when req.user is present", async () => {
    const pallet = await createPallet("P-Event");
    const group = await PalletGroup.create({
      title: "Group Event",
      order: 1,
      pallets: [],
    });
    const user = await createTestUser({
      username: `set-pallets-event-${Date.now()}`,
    });

    const req = {
      user: { id: user._id.toString(), role: "ADMIN" },
      body: {
        groupId: group._id.toString(),
        palletIds: [pallet._id.toString()],
      },
    } as unknown as Request;

    await setPalletsController(req, res);

    expect(responseStatus.code).toBe(200);
    const events = await Event.find({ department: "pallet-groups" });
    expect(events).toHaveLength(1);
    expect(events[0].description).toContain("Group Event");
  });

  it("400: validation error when palletIds is empty", async () => {
    const group = await PalletGroup.create({
      title: "Group A",
      order: 1,
      pallets: [],
    });

    const req = {
      body: { groupId: group._id.toString(), palletIds: [] },
    } as unknown as Request;

    await setPalletsController(req, res);

    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Invalid data");
  });
});

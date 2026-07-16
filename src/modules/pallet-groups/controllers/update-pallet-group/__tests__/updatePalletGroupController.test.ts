import { Request, Response } from "express";
import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestUser } from "../../../../../test/setup.js";
import { Event } from "../../../../events/models/Event.js";
import { PalletGroup } from "../../../models/PalletGroup.js";
import { updatePalletGroupController } from "../updatePalletGroupController.js";

describe("updatePalletGroupController", () => {
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

  it("200: updates group title", async () => {
    const group = await PalletGroup.create({
      title: "Old Title",
      order: 1,
      pallets: [],
    });

    const req = {
      params: { id: group._id.toString() },
      body: { title: "New Title" },
    } as unknown as Request;

    await updatePalletGroupController(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.message).toBe("Pallet group updated successfully");
    expect((responseJson.data as { title: string }).title).toBe("New Title");
  });

  it("200: creates audit event when req.user is present", async () => {
    const group = await PalletGroup.create({
      title: "Old Title Event",
      order: 1,
      pallets: [],
    });
    const user = await createTestUser({
      username: `update-pallet-group-event-${Date.now()}`,
    });

    const req = {
      user: { id: user._id.toString(), role: "ADMIN" },
      params: { id: group._id.toString() },
      body: { title: "New Title Event" },
    } as unknown as Request;

    await updatePalletGroupController(req, res);

    expect(responseStatus.code).toBe(200);
    const events = await Event.find({ department: "pallet-groups" });
    expect(events).toHaveLength(1);
    expect(events[0].description).toContain("New Title Event");
  });

  it("400: validation error for invalid id", async () => {
    const req = {
      params: { id: "invalid-id" },
      body: { title: "New Title" },
    } as unknown as Request;

    await updatePalletGroupController(req, res);

    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Invalid data");
  });

  it("400: group not found", async () => {
    const req = {
      params: { id: new mongoose.Types.ObjectId().toString() },
      body: { title: "New Title" },
    } as unknown as Request;

    await updatePalletGroupController(req, res);

    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Pallet group not found");
  });
});

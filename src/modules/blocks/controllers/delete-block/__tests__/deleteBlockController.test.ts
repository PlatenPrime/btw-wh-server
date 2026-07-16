import { Request, Response } from "express";
import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestUser } from "../../../../../test/setup.js";
import { Event } from "../../../../events/models/Event.js";
import { Block } from "../../../models/Block.js";
import { Seg } from "../../../../segs/models/Seg.js";
import { deleteBlock } from "../deleteBlock.js";

describe("deleteBlockController", () => {
  let res: Response;
  let responseJson: any;
  let responseStatus: any;

  beforeEach(() => {
    responseJson = {};
    responseStatus = {};
    res = {
      status: function (code: number) {
        responseStatus.code = code;
        return this;
      },
      json: function (data: any) {
        responseJson = data;
        return this;
      },
    } as unknown as Response;
  });

  it("200: deletes block successfully", async () => {
    const block = await Block.create({ title: "Block A", order: 1, segs: [] });

    const req = {
      params: { id: block._id.toString() },
    } as unknown as Request;

    await deleteBlock(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.message).toBe("Block deleted successfully");
    expect(responseJson.data.title).toBe("Block A");

    const deleted = await Block.findById(block._id);
    expect(deleted).toBeNull();
  });

  it("200: creates audit event when req.user is present", async () => {
    const block = await Block.create({ title: "Block Event", order: 1, segs: [] });
    const user = await createTestUser({
      username: `delete-block-event-${Date.now()}`,
    });

    const req = {
      user: { id: user._id.toString(), role: "PRIME" },
      params: { id: block._id.toString() },
    } as unknown as Request;

    await deleteBlock(req, res);

    expect(responseStatus.code).toBe(200);
    const events = await Event.find({ department: "blocks" });
    expect(events).toHaveLength(1);
    expect(events[0].description).toContain("Block Event");
  });

  it("404: block not found", async () => {
    const req = {
      params: { id: new mongoose.Types.ObjectId().toString() },
    } as unknown as Request;

    await deleteBlock(req, res);

    expect(responseStatus.code).toBe(404);
    expect(responseJson.message).toBe("Block not found");
  });

  it("400: invalid block ID format", async () => {
    const req = { params: { id: "invalid-id" } } as unknown as Request;

    await deleteBlock(req, res);

    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Invalid block ID format");
  });

  it("200: deletes block with segments", async () => {
    const block = await Block.create({ title: "Block A", order: 1, segs: [] });
    const seg = await Seg.create({
      block: block._id,
      blockData: { _id: block._id, title: block.title },
      order: 1,
      sector: 1001,
      zones: [],
    });

    const req = {
      params: { id: block._id.toString() },
    } as unknown as Request;

    await deleteBlock(req, res);

    expect(responseStatus.code).toBe(200);
    const deletedSeg = await Seg.findById(seg._id);
    expect(deletedSeg).toBeNull();
  });
});

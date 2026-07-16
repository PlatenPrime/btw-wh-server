import { Request, Response } from "express";
import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestUser } from "../../../../../test/setup.js";
import { Block } from "../../../../blocks/models/Block.js";
import { Event } from "../../../../events/models/Event.js";
import { Zone } from "../../../../zones/models/Zone.js";
import { createSeg } from "../createSeg.js";

describe("createSeg Controller", () => {
  let mockRequest: Partial<Request>;
  let responseJson: Record<string, unknown>;
  let responseStatus: { code?: number };
  let res: Response;

  const createZone = async () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 99) + 1;
    return Zone.create({
      title: `42-${(timestamp % 99) + 1}-${random}`,
      bar: Math.max(1, Math.floor(Math.random() * 1_000_000)),
      sector: 0,
    });
  };

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

  it("201: creates segment with valid data", async () => {
    const block = await Block.create({ title: `Block-${Date.now()}`, order: 1, segs: [] });
    const zone = await createZone();

    mockRequest = {
      body: {
        blockData: { _id: block._id.toString(), title: block.title },
        order: 1,
        zones: [zone._id.toString()],
      },
    };

    await createSeg(mockRequest as Request, res);

    expect(responseStatus.code).toBe(201);
    expect(responseJson.message).toBe("Segment created successfully");
    expect((responseJson.data as { order: number }).order).toBe(1);
    expect((responseJson.data as { _id: string })._id).toBeDefined();
  });

  it("201: creates audit event when req.user is present", async () => {
    const block = await Block.create({ title: `Block-${Date.now()}-event`, order: 1, segs: [] });
    const zone = await createZone();
    const user = await createTestUser({
      username: `create-seg-event-${Date.now()}`,
    });

    mockRequest = {
      user: { id: user._id.toString(), role: "ADMIN" },
      body: {
        blockData: { _id: block._id.toString(), title: block.title },
        order: 1,
        zones: [zone._id.toString()],
      },
    };

    await createSeg(mockRequest as Request, res);

    expect(responseStatus.code).toBe(201);
    const events = await Event.find({ department: "segs" });
    expect(events).toHaveLength(1);
    expect(events[0].description).toContain(block.title);
  });

  it("400: validation error when zones array is empty", async () => {
    const block = await Block.create({ title: `Block-${Date.now()}-v`, order: 1, segs: [] });

    mockRequest = {
      body: {
        blockData: { _id: block._id.toString(), title: block.title },
        order: 1,
        zones: [],
      },
    };

    await createSeg(mockRequest as Request, res);

    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Validation error");
    expect(Array.isArray(responseJson.errors)).toBe(true);
  });

  it("404: block not found", async () => {
    const zone = await createZone();
    const missingBlockId = new mongoose.Types.ObjectId().toString();

    mockRequest = {
      body: {
        blockData: { _id: missingBlockId, title: "Missing" },
        order: 1,
        zones: [zone._id.toString()],
      },
    };

    await createSeg(mockRequest as Request, res);

    expect(responseStatus.code).toBe(404);
    expect(responseJson.message).toBe("Block not found");
  });

  it("500: zones already belong to segments (case-sensitive zones check in controller)", async () => {
    const block = await Block.create({ title: `Block-${Date.now()}-z`, order: 1, segs: [] });
    const zone = await createZone();

    const existingSegId = new mongoose.Types.ObjectId();
    await Zone.updateOne(
      { _id: zone._id },
      { $set: { "seg.id": existingSegId, sector: 1001 } }
    );

    mockRequest = {
      body: {
        blockData: { _id: block._id.toString(), title: block.title },
        order: 1,
        zones: [zone._id.toString()],
      },
    };

    await createSeg(mockRequest as Request, res);

    expect(responseStatus.code).toBe(500);
    expect(responseJson.message).toBe("Server error");
  });
});

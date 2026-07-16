import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { createTestUser } from "../../../../../test/setup.js";
import { Block } from "../../../../blocks/models/Block.js";
import { Event } from "../../../../events/models/Event.js";
import { Zone } from "../../../../zones/models/Zone.js";
import { Seg } from "../../../models/Seg.js";
import { upsertSegsController } from "../upsertSegsController.js";

describe("upsertSegsController", () => {
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

  it("200: upserts segments successfully", async () => {
    const block = await Block.create({ title: `Block-${Date.now()}`, order: 1, segs: [] });
    const zoneA = await createZone();
    const zoneB = await createZone();

    mockRequest = {
      body: [
        {
          blockId: block._id.toString(),
          order: 1,
          zones: [zoneA._id.toString(), zoneB._id.toString()],
        },
      ],
    };

    await upsertSegsController(mockRequest as Request, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.message).toBe("Segments upsert completed");
    expect(
      (responseJson.data as { processedSegs: unknown[] }).processedSegs
    ).toHaveLength(1);

    const createdSeg = await Seg.findOne({ block: block._id }).exec();
    expect(createdSeg).not.toBeNull();
    expect(createdSeg?.zones).toHaveLength(2);
  });

  it("200: creates audit event when req.user is present", async () => {
    const block = await Block.create({ title: `Block-${Date.now()}-event`, order: 1, segs: [] });
    const zoneA = await createZone();
    const user = await createTestUser({
      username: `upsert-segs-event-${Date.now()}`,
    });

    mockRequest = {
      user: { id: user._id.toString(), role: "ADMIN" },
      body: [
        {
          blockId: block._id.toString(),
          order: 1,
          zones: [zoneA._id.toString()],
        },
      ],
    };

    await upsertSegsController(mockRequest as Request, res);

    expect(responseStatus.code).toBe(200);
    const events = await Event.find({ department: "segs" });
    expect(events).toHaveLength(1);
  });

  it("400: validation error for empty payload", async () => {
    mockRequest = { body: [] };

    await upsertSegsController(mockRequest as Request, res);

    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Validation error");
    expect(Array.isArray(responseJson.errors)).toBe(true);
  });

  it("400: validation error for invalid blockId", async () => {
    const zone = await createZone();

    mockRequest = {
      body: [
        {
          blockId: "not-valid",
          order: 1,
          zones: [zone._id.toString()],
        },
      ],
    };

    await upsertSegsController(mockRequest as Request, res);

    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Validation error");
  });

  it("500: block not found", async () => {
    const zone = await createZone();
    const missingBlockId = "507f1f77bcf86cd799439011";

    mockRequest = {
      body: [
        {
          blockId: missingBlockId,
          order: 1,
          zones: [zone._id.toString()],
        },
      ],
    };

    await upsertSegsController(mockRequest as Request, res);

    expect(responseStatus.code).toBe(500);
    expect(responseJson.message).toBe("Server error");
  });
});

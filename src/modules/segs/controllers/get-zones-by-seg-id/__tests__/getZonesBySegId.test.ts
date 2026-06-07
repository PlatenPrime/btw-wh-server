import { Request, Response } from "express";
import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { Block } from "../../../../blocks/models/Block.js";
import { Zone } from "../../../../zones/models/Zone.js";
import { Seg } from "../../../models/Seg.js";
import { getZonesBySegId } from "../getZonesBySegId.js";

describe("getZonesBySegId Controller", () => {
  let mockRequest: Partial<Request>;
  let responseJson: Record<string, unknown>;
  let responseStatus: { code?: number };
  let res: Response;

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

  it("200: returns zones for segment", async () => {
    const block = await Block.create({ title: `Block-${Date.now()}`, order: 1, segs: [] });
    const zone = await Zone.create({
      title: `10-${Date.now() % 99}`,
      bar: Math.max(1, Date.now() % 1_000_000),
      sector: 0,
    });

    const seg = await Seg.create({
      block: block._id,
      blockData: { _id: block._id, title: block.title },
      order: 1,
      sector: 1001,
      zones: [{ _id: zone._id, title: zone.title }],
    });

    await Zone.updateOne(
      { _id: zone._id },
      { $set: { "seg.id": seg._id, sector: seg.sector } }
    );

    mockRequest = { params: { segId: seg._id.toString() } };

    await getZonesBySegId(mockRequest as Request, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.exists).toBe(true);
    expect(responseJson.message).toBe("Zones retrieved successfully");
    expect((responseJson.data as unknown[]).length).toBe(1);
  });

  it("200: returns exists false when no zones found", async () => {
    const block = await Block.create({ title: `Block-${Date.now()}-e`, order: 1, segs: [] });
    const seg = await Seg.create({
      block: block._id,
      blockData: { _id: block._id, title: block.title },
      order: 1,
      sector: 1001,
      zones: [],
    });

    mockRequest = { params: { segId: seg._id.toString() } };

    await getZonesBySegId(mockRequest as Request, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.exists).toBe(false);
    expect(responseJson.data).toEqual([]);
  });

  it("400: invalid segment id format", async () => {
    mockRequest = { params: { segId: "invalid" } };

    await getZonesBySegId(mockRequest as Request, res);

    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Validation error");
    expect(Array.isArray(responseJson.errors)).toBe(true);
  });
});

import { Request, Response } from "express";
import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { Block } from "../../../../blocks/models/Block.js";
import { Seg } from "../../../models/Seg.js";
import { getSegsByBlockId } from "../getSegsByBlockId.js";

describe("getSegsByBlockId Controller", () => {
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

  it("200: returns segments for block sorted by order", async () => {
    const blockA = await Block.create({ title: `Block-A-${Date.now()}`, order: 1, segs: [] });
    const blockB = await Block.create({ title: `Block-B-${Date.now()}`, order: 2, segs: [] });

    await Seg.create({
      block: blockA._id,
      blockData: { _id: blockA._id, title: blockA.title },
      order: 2,
      sector: 1002,
      zones: [],
    });
    await Seg.create({
      block: blockA._id,
      blockData: { _id: blockA._id, title: blockA.title },
      order: 1,
      sector: 1001,
      zones: [],
    });
    await Seg.create({
      block: blockB._id,
      blockData: { _id: blockB._id, title: blockB.title },
      order: 1,
      sector: 2001,
      zones: [],
    });

    mockRequest = { params: { blockId: blockA._id.toString() } };

    await getSegsByBlockId(mockRequest as Request, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.exists).toBe(true);
    expect(responseJson.message).toBe("Segments retrieved successfully");

    const data = responseJson.data as Array<{ order: number; block: string }>;
    expect(data).toHaveLength(2);
    expect(data[0].order).toBe(1);
    expect(data[1].order).toBe(2);
    expect(data.every((seg) => seg.block.toString() === blockA._id.toString())).toBe(true);
  });

  it("200: returns exists false when block has no segments", async () => {
    const block = await Block.create({ title: `Block-empty-${Date.now()}`, order: 1, segs: [] });

    mockRequest = { params: { blockId: block._id.toString() } };

    await getSegsByBlockId(mockRequest as Request, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.exists).toBe(false);
    expect(responseJson.data).toEqual([]);
  });

  it("400: invalid block id format", async () => {
    mockRequest = { params: { blockId: "bad-id" } };

    await getSegsByBlockId(mockRequest as Request, res);

    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Validation error");
    expect(Array.isArray(responseJson.errors)).toBe(true);
  });
});

import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { Block } from "../../../../blocks/models/Block.js";
import { Seg } from "../../../models/Seg.js";
import { getAllSegs } from "../getAllSegs.js";

describe("getAllSegs Controller", () => {
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

  it("200: returns all segments sorted by order", async () => {
    const block = await Block.create({ title: `Block-${Date.now()}`, order: 1, segs: [] });

    await Seg.create({
      block: block._id,
      blockData: { _id: block._id, title: block.title },
      order: 2,
      sector: 1002,
      zones: [],
    });
    await Seg.create({
      block: block._id,
      blockData: { _id: block._id, title: block.title },
      order: 1,
      sector: 1001,
      zones: [],
    });

    mockRequest = {};

    await getAllSegs(mockRequest as Request, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.exists).toBe(true);
    expect(responseJson.message).toBe("Segments retrieved successfully");

    const data = responseJson.data as Array<{ order: number }>;
    expect(data).toHaveLength(2);
    expect(data[0].order).toBe(1);
    expect(data[1].order).toBe(2);
  });

  it("200: returns exists false when no segments", async () => {
    mockRequest = {};

    await getAllSegs(mockRequest as Request, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.exists).toBe(false);
    expect(responseJson.data).toEqual([]);
  });
});

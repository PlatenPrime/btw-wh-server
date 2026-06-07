import { Request, Response } from "express";
import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import { Block } from "../../../../blocks/models/Block.js";
import { Seg } from "../../../models/Seg.js";
import { deleteSeg } from "../deleteSeg.js";

describe("deleteSeg Controller", () => {
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

  it("200: deletes segment by valid id", async () => {
    const block = await Block.create({ title: `Block-${Date.now()}`, order: 1, segs: [] });
    const seg = await Seg.create({
      block: block._id,
      blockData: { _id: block._id, title: block.title },
      order: 1,
      sector: 1001,
      zones: [],
    });

    mockRequest = { params: { id: seg._id.toString() } };

    await deleteSeg(mockRequest as Request, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.message).toBe("Segment deleted successfully");
    expect(String((responseJson.data as { _id: { toString(): string } })._id)).toBe(
      seg._id.toString()
    );
    expect(await Seg.findById(seg._id).exec()).toBeNull();
  });

  it("404: segment not found", async () => {
    mockRequest = {
      params: { id: new mongoose.Types.ObjectId().toString() },
    };

    await deleteSeg(mockRequest as Request, res);

    expect(responseStatus.code).toBe(404);
    expect(responseJson.message).toBe("Segment not found");
  });

  it("400: invalid segment id format", async () => {
    mockRequest = { params: { id: "invalid-id" } };

    await deleteSeg(mockRequest as Request, res);

    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Validation error");
    expect(Array.isArray(responseJson.errors)).toBe(true);
  });
});

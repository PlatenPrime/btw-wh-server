import { Request, Response } from "express";
import mongoose from "mongoose";
import { beforeEach, describe, expect, it } from "vitest";
import "../../../../../test/setup.js";
import { Block } from "../../../models/Block.js";
import { getBlockById } from "../getBlockById.js";

describe("getBlockByIdController", () => {
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

  it("200: returns block when found", async () => {
    const block = await Block.create({ title: "Block A", order: 1, segs: [] });

    const req = {
      params: { id: block._id.toString() },
    } as unknown as Request;

    await getBlockById(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.exists).toBe(true);
    expect(responseJson.message).toBe("Block retrieved successfully");
    expect(responseJson.data.title).toBe("Block A");
  });

  it("200: returns exists=false when block not found", async () => {
    const req = {
      params: { id: new mongoose.Types.ObjectId().toString() },
    } as unknown as Request;

    await getBlockById(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.exists).toBe(false);
    expect(responseJson.message).toBe("Block not found");
    expect(responseJson.data).toBeNull();
  });

  it("400: invalid block ID format", async () => {
    const req = { params: { id: "invalid-id" } } as unknown as Request;

    await getBlockById(req, res);

    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Invalid block ID format");
  });
});

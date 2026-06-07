import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import "../../../../../test/setup.js";
import { Block } from "../../../models/Block.js";
import { getAllBlocks } from "../getAllBlocks.js";

describe("getAllBlocksController", () => {
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

  it("200: returns all blocks with exists=true", async () => {
    await Block.create({ title: "Block A", order: 1, segs: [] });
    await Block.create({ title: "Block B", order: 2, segs: [] });

    const req = {} as unknown as Request;

    await getAllBlocks(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.exists).toBe(true);
    expect(responseJson.message).toBe("Blocks retrieved successfully");
    expect(responseJson.data).toHaveLength(2);
  });

  it("200: returns empty list with exists=false", async () => {
    const req = {} as unknown as Request;

    await getAllBlocks(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.exists).toBe(false);
    expect(responseJson.data).toEqual([]);
  });
});

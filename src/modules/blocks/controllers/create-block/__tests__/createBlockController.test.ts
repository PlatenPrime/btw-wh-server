import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import "../../../../../test/setup.js";
import { Block } from "../../../models/Block.js";
import { createBlock } from "../createBlock.js";

describe("createBlockController", () => {
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

  it("201: creates block successfully", async () => {
    const req = { body: { title: "New Block" } } as unknown as Request;

    await createBlock(req, res);

    expect(responseStatus.code).toBe(201);
    expect(responseJson.message).toBe("Block created successfully");
    expect(responseJson.data.title).toBe("New Block");
    expect(responseJson.data.order).toBe(1);
    expect(responseJson.data._id).toBeDefined();
  });

  it("400: validation error when title is missing", async () => {
    const req = { body: {} } as unknown as Request;

    await createBlock(req, res);

    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Validation error");
    expect(Array.isArray(responseJson.errors)).toBe(true);
  });

  it("400: validation error when title is empty", async () => {
    const req = { body: { title: "" } } as unknown as Request;

    await createBlock(req, res);

    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Validation error");
  });

  it("409: duplicate title detected before save", async () => {
    await Block.create({ title: "Existing Block", order: 1, segs: [] });

    const req = { body: { title: "Existing Block" } } as unknown as Request;

    await createBlock(req, res);

    expect(responseStatus.code).toBe(409);
    expect(responseJson.message).toBe("Block with this title already exists");
    expect(responseJson.duplicateFields).toContain("title");
  });
});

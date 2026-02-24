import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { Constant } from "../../models/Constant.js";
import { getConstantByIdController } from "../get-constant-by-id/getConstantByIdController.js";

describe("getConstantByIdController", () => {
  let res: Response;
  let responseJson: Record<string, unknown>;
  let responseStatus: { code?: number };

  beforeEach(async () => {
    await Constant.deleteMany({});
    responseJson = {};
    responseStatus = {};
    res = {
      status(code: number) {
        responseStatus.code = code;
        return this;
      },
      json(data: unknown) {
        responseJson = data as Record<string, unknown>;
        return this;
      },
      headersSent: false,
    } as unknown as Response;
  });

  it("400 when id invalid", async () => {
    const req = { params: { id: "invalid" } } as unknown as Request;
    await getConstantByIdController(req, res);
    expect(responseStatus.code).toBe(400);
  });

  it("404 when constant not found", async () => {
    const req = {
      params: { id: "000000000000000000000000" },
    } as unknown as Request;
    await getConstantByIdController(req, res);
    expect(responseStatus.code).toBe(404);
  });

  it("200 returns constant data", async () => {
    const constant = await Constant.create({
      name: "acme",
      title: "Acme",
      data: { key: "value" },
    });
    const req = { params: { id: constant._id.toString() } } as unknown as Request;
    await getConstantByIdController(req, res);
    expect(responseStatus.code).toBe(200);
    expect((responseJson.data as { name: string }).name).toBe("acme");
  });
});

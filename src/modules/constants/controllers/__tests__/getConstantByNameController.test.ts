import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { Constant } from "../../models/Constant.js";
import { getConstantByNameController } from "../get-constant-by-name/getConstantByNameController.js";

describe("getConstantByNameController", () => {
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

  it("404 when constant not found", async () => {
    const req = { params: { name: "nonexistent" } } as unknown as Request;
    await getConstantByNameController(req, res);
    expect(responseStatus.code).toBe(404);
  });

  it("200 returns constant data", async () => {
    await Constant.create({
      name: "acme",
      title: "Acme",
      data: { key: "value" },
    });
    const req = { params: { name: "acme" } } as unknown as Request;
    await getConstantByNameController(req, res);
    expect(responseStatus.code).toBe(200);
    expect((responseJson.data as { name: string }).name).toBe("acme");
  });
});

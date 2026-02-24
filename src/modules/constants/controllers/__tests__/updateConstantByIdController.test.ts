import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { Constant } from "../../models/Constant.js";
import { updateConstantByIdController } from "../update-constant-by-id/updateConstantByIdController.js";

describe("updateConstantByIdController", () => {
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
    const req = {
      params: { id: "invalid" },
      body: { title: "New" },
    } as unknown as Request;
    await updateConstantByIdController(req, res);
    expect(responseStatus.code).toBe(400);
  });

  it("404 when constant not found", async () => {
    const req = {
      params: { id: "000000000000000000000000" },
      body: { title: "New" },
    } as unknown as Request;
    await updateConstantByIdController(req, res);
    expect(responseStatus.code).toBe(404);
  });

  it("200 updates and returns data", async () => {
    const constant = await Constant.create({
      name: "x",
      title: "Old",
      data: {},
    });
    const req = {
      params: { id: constant._id.toString() },
      body: { title: "New Title" },
    } as unknown as Request;
    await updateConstantByIdController(req, res);
    expect(responseStatus.code).toBe(200);
    expect((responseJson.data as { title: string }).title).toBe("New Title");
  });
});

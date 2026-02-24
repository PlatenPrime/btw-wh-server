import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { Constant } from "../../models/Constant.js";
import { createConstantController } from "../create-constant/createConstantController.js";

describe("createConstantController", () => {
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

  it("400 when name missing", async () => {
    const req = {
      body: {
        title: "Title",
        data: {},
      },
    } as unknown as Request;
    await createConstantController(req, res);
    expect(responseStatus.code).toBe(400);
  });

  it("400 when name contains spaces", async () => {
    const req = {
      body: {
        name: "my key",
        title: "My Key",
        data: {},
      },
    } as unknown as Request;
    await createConstantController(req, res);
    expect(responseStatus.code).toBe(400);
  });

  it("201 creates constant and returns data", async () => {
    const req = {
      body: {
        name: "config",
        title: "Config",
        data: { foo: "bar" },
      },
    } as unknown as Request;
    await createConstantController(req, res);
    expect(responseStatus.code).toBe(201);
    expect((responseJson.data as { name: string }).name).toBe("config");
    const count = await Constant.countDocuments();
    expect(count).toBe(1);
  });
});

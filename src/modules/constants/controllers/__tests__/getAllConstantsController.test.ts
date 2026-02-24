import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { Constant } from "../../models/Constant.js";
import { getAllConstantsController } from "../get-all-constants/getAllConstantsController.js";

describe("getAllConstantsController", () => {
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

  it("200 returns empty array when no constants", async () => {
    const req = {} as unknown as Request;
    await getAllConstantsController(req, res);
    expect(responseStatus.code).toBe(200);
    expect(Array.isArray(responseJson.data)).toBe(true);
    expect((responseJson.data as unknown[]).length).toBe(0);
  });

  it("200 returns list of constants", async () => {
    await Constant.create({
      name: "key1",
      title: "Title",
      data: { foo: "bar" },
    });
    const req = {} as unknown as Request;
    await getAllConstantsController(req, res);
    expect(responseStatus.code).toBe(200);
    expect((responseJson.data as unknown[]).length).toBe(1);
    expect((responseJson.data as { name: string }[])[0].name).toBe("key1");
  });
});

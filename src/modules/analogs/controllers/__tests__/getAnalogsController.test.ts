import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { Analog } from "../../models/Analog.js";
import { getAnalogsController } from "../get-analogs/getAnalogsController.js";

describe("getAnalogsController", () => {
  let res: Response;
  let responseJson: Record<string, unknown>;
  let responseStatus: { code?: number };

  beforeEach(async () => {
    await Analog.deleteMany({});
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

  it("200 returns analogs with pagination", async () => {
    await Analog.create({
      konkName: "k",
      prodName: "p",
      url: "https://x.com",
    });
    const req = { query: { page: "1", limit: "10" } } as unknown as Request;
    await getAnalogsController(req, res);
    expect(responseStatus.code).toBe(200);
    expect(Array.isArray(responseJson.data)).toBe(true);
    expect(responseJson.pagination).toBeDefined();
    expect((responseJson.pagination as { total: number }).total).toBe(1);
  });

  it("400 when query invalid", async () => {
    const req = { query: { page: "-1" } } as unknown as Request;
    await getAnalogsController(req, res);
    expect(responseStatus.code).toBe(400);
  });
});

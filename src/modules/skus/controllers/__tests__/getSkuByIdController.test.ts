import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { Sku } from "../../models/Sku.js";
import { getSkuByIdController } from "../get-sku-by-id/getSkuByIdController.js";

describe("getSkuByIdController", () => {
  let res: Response;
  let responseJson: Record<string, unknown>;
  let responseStatus: { code?: number };

  beforeEach(async () => {
    await Sku.deleteMany({});
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

  it("400 for invalid id", async () => {
    const req = { params: { id: "bad-id" } } as unknown as Request;
    await getSkuByIdController(req, res);
    expect(responseStatus.code).toBe(400);
  });

  it("404 when sku not found", async () => {
    const req = {
      params: { id: "000000000000000000000000" },
    } as unknown as Request;
    await getSkuByIdController(req, res);
    expect(responseStatus.code).toBe(404);
  });
});

import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { Analog } from "../../models/Analog.js";
import { getAnalogsByProdController } from "../get-analogs-by-prod/getAnalogsByProdController.js";

describe("getAnalogsByProdController", () => {
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

  it("400 when prodName empty", async () => {
    const req = { params: { prodName: "" } } as unknown as Request;
    await getAnalogsByProdController(req, res);
    expect(responseStatus.code).toBe(400);
  });

  it("200 returns analogs and pagination for prodName", async () => {
    await Analog.create([
      { konkName: "k1", prodName: "maker", url: "https://a.com" },
      { konkName: "k2", prodName: "maker", url: "https://b.com" },
    ]);
    const req = {
      params: { prodName: "maker" },
      query: {},
    } as unknown as Request;
    await getAnalogsByProdController(req, res);
    expect(responseStatus.code).toBe(200);
    expect((responseJson.data as unknown[]).length).toBe(2);
    expect(responseJson.pagination).toBeDefined();
    expect((responseJson.pagination as { total: number }).total).toBe(2);
  });
});

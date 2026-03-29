import { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { Skugr } from "../../../skugrs/models/Skugr.js";
import { Sku } from "../../models/Sku.js";
import { getSkusBySkugrIdController } from "../get-skus-by-skugr-id/getSkusBySkugrIdController.js";

describe("getSkusBySkugrIdController", () => {
  let res: Response;
  let responseJson: Record<string, any>;
  let responseStatus: { code?: number };

  beforeEach(async () => {
    await Sku.deleteMany({});
    await Skugr.deleteMany({});
    responseJson = {};
    responseStatus = {};
    res = {
      status(code: number) {
        responseStatus.code = code;
        return this;
      },
      json(data: unknown) {
        responseJson = data as Record<string, any>;
        return this;
      },
      headersSent: false,
    } as unknown as Response;
  });

  it("400 for invalid skugrId", async () => {
    const req = {
      params: { skugrId: "not-an-id" },
      query: {},
    } as unknown as Request;

    await getSkusBySkugrIdController(req, res);

    expect(responseStatus.code).toBe(400);
  });

  it("400 for invalid query params", async () => {
    const req = {
      params: { skugrId: "507f1f77bcf86cd799439011" },
      query: { page: "0", limit: "10" },
    } as unknown as Request;

    await getSkusBySkugrIdController(req, res);

    expect(responseStatus.code).toBe(400);
  });

  it("404 when skugr not found", async () => {
    const req = {
      params: { skugrId: "507f1f77bcf86cd799439011" },
      query: { page: "1", limit: "10" },
    } as unknown as Request;

    await getSkusBySkugrIdController(req, res);

    expect(responseStatus.code).toBe(404);
    expect(responseJson.message).toBe("Skugr not found");
  });

  it("200 returns skus for skugr with search", async () => {
    const sku = await Sku.create({
      konkName: "k1",
      prodName: "p1",
      productId: "k1-x",
      title: "Unique Title Here",
      url: "https://k1.com/x",
    });
    const skugr = await Skugr.create({
      konkName: "k1",
      prodName: "p1",
      title: "grp",
      url: "https://k1.com/g",
      skus: [sku._id],
    });

    const req = {
      params: { skugrId: skugr._id.toString() },
      query: { page: "1", limit: "10", search: "unique" },
    } as unknown as Request;

    await getSkusBySkugrIdController(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.data).toHaveLength(1);
    expect(responseJson.pagination.total).toBe(1);
  });
});

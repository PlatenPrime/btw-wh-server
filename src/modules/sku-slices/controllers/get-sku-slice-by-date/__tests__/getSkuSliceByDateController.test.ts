import type { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { Sku } from "../../../../skus/models/Sku.js";
import { SkuSlice } from "../../../models/SkuSlice.js";
import { getSkuSliceByDateController } from "../getSkuSliceByDateController.js";

describe("getSkuSliceByDateController", () => {
  let res: Response;
  let responseJson: Record<string, unknown>;
  let responseStatus: { code?: number };

  beforeEach(async () => {
    await Sku.deleteMany({});
    await SkuSlice.deleteMany({});
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

  it("400 when skuId invalid", async () => {
    const req = {
      params: { skuId: "bad" },
      query: { date: "2026-03-01" },
    } as unknown as Request;
    await getSkuSliceByDateController(req, res);
    expect(responseStatus.code).toBe(400);
  });

  it("404 when sku not found", async () => {
    const req = {
      params: { skuId: "507f1f77bcf86cd799439011" },
      query: { date: "2026-03-01" },
    } as unknown as Request;
    await getSkuSliceByDateController(req, res);
    expect(responseStatus.code).toBe(404);
  });

  it("200 returns stock and price", async () => {
    const sku = await Sku.create({
      konkName: "air",
      prodName: "gemar",
      productId: "air-by-date-1",
      title: "T",
      url: "https://e.com/t",
    });
    await SkuSlice.create({
      konkName: "air",
      date: new Date("2026-03-01T00:00:00.000Z"),
      data: { "air-by-date-1": { stock: 7, price: 11 } },
    });
    const req = {
      params: { skuId: sku._id.toString() },
      query: { date: "2026-03-01" },
    } as unknown as Request;
    await getSkuSliceByDateController(req, res);
    expect(responseStatus.code).toBe(200);
    const data = responseJson.data as { stock: number; price: number };
    expect(data.stock).toBe(7);
    expect(data.price).toBe(11);
  });
});

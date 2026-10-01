import type { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { Sku } from "../../../../skus/models/Sku.js";
import { SkuSlice } from "../../../models/SkuSlice.js";
import { patchSkuSliceByDateController } from "../patchSkuSliceByDateController.js";

describe("patchSkuSliceByDateController", () => {
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
      body: { date: "2026-09-20", stock: 3, price: 110 },
    } as unknown as Request;
    await patchSkuSliceByDateController(req, res);
    expect(responseStatus.code).toBe(400);
  });

  it("400 when stock is not a number", async () => {
    const req = {
      params: { skuId: "507f1f77bcf86cd799439011" },
      body: { date: "2026-09-20", stock: "3", price: 110 },
    } as unknown as Request;
    await patchSkuSliceByDateController(req, res);
    expect(responseStatus.code).toBe(400);
  });

  it("400 when date mixed with dateFrom", async () => {
    const req = {
      params: { skuId: "507f1f77bcf86cd799439011" },
      body: {
        date: "2026-09-20",
        dateFrom: "2026-09-20",
        dateTo: "2026-09-21",
        stock: 3,
        price: 110,
      },
    } as unknown as Request;
    await patchSkuSliceByDateController(req, res);
    expect(responseStatus.code).toBe(400);
  });

  it("404 when sku not found", async () => {
    const req = {
      params: { skuId: "507f1f77bcf86cd799439011" },
      body: { date: "2026-09-20", stock: 3, price: 110 },
    } as unknown as Request;
    await patchSkuSliceByDateController(req, res);
    expect(responseStatus.code).toBe(404);
  });

  it("200 updates point and returns previous", async () => {
    const sku = await Sku.create({
      konkName: "perfect",
      prodName: "pd",
      productId: "perfect-ctrl-1",
      title: "T",
      url: "https://e.com/t",
    });
    await SkuSlice.create({
      konkName: "perfect",
      date: new Date("2026-09-20T00:00:00.000Z"),
      data: { "perfect-ctrl-1": { stock: 60, price: 5.5 } },
    });
    const req = {
      params: { skuId: sku._id.toString() },
      body: { date: "2026-09-20", stock: 3, price: 110 },
    } as unknown as Request;
    await patchSkuSliceByDateController(req, res);
    expect(responseStatus.code).toBe(200);
    const data = responseJson.data as {
      productId: string;
      stock: number;
      price: number;
      previous: { stock: number; price: number } | null;
      created: boolean;
    };
    expect(data.productId).toBe("perfect-ctrl-1");
    expect(data.stock).toBe(3);
    expect(data.price).toBe(110);
    expect(data.previous).toEqual({ stock: 60, price: 5.5 });
    expect(data.created).toBe(false);
  });

  it("200 creates day document when missing", async () => {
    const sku = await Sku.create({
      konkName: "perfect",
      prodName: "pd",
      productId: "perfect-ctrl-new",
      title: "T",
      url: "https://e.com/t",
    });
    const req = {
      params: { skuId: sku._id.toString() },
      body: { date: "2026-09-20", stock: 3, price: 110 },
    } as unknown as Request;
    await patchSkuSliceByDateController(req, res);
    expect(responseStatus.code).toBe(200);
    const data = responseJson.data as { created: boolean; previous: null };
    expect(data.created).toBe(true);
    expect(data.previous).toBeNull();
  });

  it("200 updates range and returns days", async () => {
    const sku = await Sku.create({
      konkName: "perfect",
      prodName: "pd",
      productId: "perfect-ctrl-range",
      title: "T",
      url: "https://e.com/t",
    });
    const req = {
      params: { skuId: sku._id.toString() },
      body: {
        dateFrom: "2026-09-20",
        dateTo: "2026-09-21",
        stock: 3,
        price: 110,
      },
    } as unknown as Request;
    await patchSkuSliceByDateController(req, res);
    expect(responseStatus.code).toBe(200);
    expect(responseJson.message).toBe(
      "Sku slice by date range updated successfully"
    );
    const data = responseJson.data as {
      updatedCount: number;
      days: unknown[];
    };
    expect(data.updatedCount).toBe(2);
    expect(data.days).toHaveLength(2);
  });

  it("400 when date mixed with periods", async () => {
    const req = {
      params: { skuId: "507f1f77bcf86cd799439011" },
      body: {
        date: "2026-09-20",
        periods: [{ dateFrom: "2026-09-20", dateTo: "2026-09-21" }],
        stock: 3,
        price: 110,
      },
    } as unknown as Request;
    await patchSkuSliceByDateController(req, res);
    expect(responseStatus.code).toBe(400);
  });

  it("200 updates periods and returns days", async () => {
    const sku = await Sku.create({
      konkName: "perfect",
      prodName: "pd",
      productId: "perfect-ctrl-periods",
      title: "T",
      url: "https://e.com/t",
    });
    const req = {
      params: { skuId: sku._id.toString() },
      body: {
        periods: [
          { dateFrom: "2026-09-20", dateTo: "2026-09-21" },
          { dateFrom: "2026-09-25", dateTo: "2026-09-25" },
        ],
        stock: 3,
        price: 110,
      },
    } as unknown as Request;
    await patchSkuSliceByDateController(req, res);
    expect(responseStatus.code).toBe(200);
    expect(responseJson.message).toBe(
      "Sku slice by date periods updated successfully"
    );
    const data = responseJson.data as {
      updatedCount: number;
      days: unknown[];
      periods: unknown[];
    };
    expect(data.updatedCount).toBe(3);
    expect(data.days).toHaveLength(3);
    expect(data.periods).toHaveLength(2);
  });
});

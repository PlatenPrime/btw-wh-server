import type { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { Sku } from "../../../../skus/models/Sku.js";
import { SkuSlice } from "../../../models/SkuSlice.js";
import { getPackFlipReviewController } from "../getPackFlipReviewController.js";

describe("getPackFlipReviewController", () => {
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

  it("400 when dateFrom after dateTo", async () => {
    const req = {
      query: {
        konkName: "perfect",
        dateFrom: "2026-09-15",
        dateTo: "2026-09-01",
      },
    } as unknown as Request;
    await getPackFlipReviewController(req, res);
    expect(responseStatus.code).toBe(400);
  });

  it("400 when konkName missing", async () => {
    const req = {
      query: { dateFrom: "2026-09-01", dateTo: "2026-09-02" },
    } as unknown as Request;
    await getPackFlipReviewController(req, res);
    expect(responseStatus.code).toBe(400);
  });

  it("200 returns dry-run inverse finding", async () => {
    await Sku.create({
      konkName: "perfect",
      prodName: "gemar",
      productId: "perfect-1",
      title: "Balloon",
      url: "https://perfect.example/1",
    });
    await SkuSlice.create({
      konkName: "perfect",
      date: new Date("2026-09-13T00:00:00.000Z"),
      data: { "perfect-1": { stock: 100, price: 100 } },
    });
    await SkuSlice.create({
      konkName: "perfect",
      date: new Date("2026-09-14T00:00:00.000Z"),
      data: { "perfect-1": { stock: 10000, price: 1 } },
    });
    await SkuSlice.create({
      konkName: "perfect",
      date: new Date("2026-09-15T00:00:00.000Z"),
      data: { "perfect-1": { stock: 100, price: 100 } },
    });

    const req = {
      query: {
        konkName: "PERFECT",
        dateFrom: "2026-09-13",
        dateTo: "2026-09-15",
      },
    } as unknown as Request;
    await getPackFlipReviewController(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.message).toBe("Pack-flip review retrieved successfully");
    const data = responseJson.data as {
      konkName: string;
      apply?: boolean;
      patched: Array<{ productId: string }>;
    };
    expect(data.konkName).toBe("perfect");
    expect(data.apply).toBeUndefined();
    expect(data.patched).toHaveLength(1);
    expect(data.patched[0]!.productId).toBe("perfect-1");
  });
});

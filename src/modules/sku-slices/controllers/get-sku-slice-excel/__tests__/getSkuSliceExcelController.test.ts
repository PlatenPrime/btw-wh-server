import type { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { Sku } from "../../../../skus/models/Sku.js";
import { SkuSlice } from "../../../models/SkuSlice.js";
import { getSkuSliceExcelController } from "../getSkuSliceExcelController.js";

describe("getSkuSliceExcelController", () => {
  let res: Response;
  let responseStatus: { code?: number };
  let responseJson: Record<string, unknown>;
  let responseHeaders: Record<string, string | number>;
  let responseBody: unknown;

  beforeEach(async () => {
    await Sku.deleteMany({});
    await SkuSlice.deleteMany({});
    responseStatus = {};
    responseJson = {};
    responseHeaders = {};
    responseBody = null;
    res = {
      status(code: number) {
        responseStatus.code = code;
        return this;
      },
      json(data: unknown) {
        responseJson = data as Record<string, unknown>;
        return this;
      },
      send(data: unknown) {
        responseBody = data;
        return this;
      },
      setHeader(name: string, value: string | number) {
        responseHeaders[name] = value;
        return this;
      },
      headersSent: false,
    } as unknown as Response;
  });

  it("400 on validation error", async () => {
    const req = {
      params: { skuId: "507f1f77bcf86cd799439011" },
      query: { dateFrom: "2026-05-10", dateTo: "2026-05-01" },
    } as unknown as Request;
    await getSkuSliceExcelController(req, res);
    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Validation error");
  });

  it("404 when sku not found", async () => {
    const req = {
      params: { skuId: "507f1f77bcf86cd799439011" },
      query: { dateFrom: "2026-05-01", dateTo: "2026-05-01" },
    } as unknown as Request;
    await getSkuSliceExcelController(req, res);
    expect(responseStatus.code).toBe(404);
  });

  it("200 sends xlsx buffer and headers", async () => {
    const sku = await Sku.create({
      konkName: "air",
      prodName: "gemar",
      productId: "air-xlsx-ctl",
      title: "X",
      url: "https://e.com/x",
    });
    const d = new Date("2026-05-01T00:00:00.000Z");
    await SkuSlice.create({
      konkName: "air",
      date: d,
      data: { "air-xlsx-ctl": { stock: 1, price: 2 } },
    });
    const req = {
      params: { skuId: sku._id.toString() },
      query: { dateFrom: "2026-05-01", dateTo: "2026-05-01" },
    } as unknown as Request;
    await getSkuSliceExcelController(req, res);
    expect(responseStatus.code).toBe(200);
    expect(
      responseHeaders["Content-Type"]
    ).toContain("spreadsheetml");
    expect(String(responseHeaders["Content-Disposition"])).toContain(
      "attachment"
    );
    expect(Buffer.isBuffer(responseBody as Buffer)).toBe(true);
    expect((responseBody as Buffer).length).toBeGreaterThan(100);
  });
});

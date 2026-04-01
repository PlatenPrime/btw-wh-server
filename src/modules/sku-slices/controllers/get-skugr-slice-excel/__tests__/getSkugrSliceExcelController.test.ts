import type { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { Sku } from "../../../../skus/models/Sku.js";
import { Skugr } from "../../../../skugrs/models/Skugr.js";
import { SkuSlice } from "../../../models/SkuSlice.js";
import { getSkugrSliceExcelController } from "../getSkugrSliceExcelController.js";

describe("getSkugrSliceExcelController", () => {
  let res: Response;
  let responseStatus: { code?: number };
  let responseJson: Record<string, unknown>;
  let responseHeaders: Record<string, string | number>;
  let responseBody: unknown;

  beforeEach(async () => {
    await Sku.deleteMany({});
    await Skugr.deleteMany({});
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

  it("400 when skugrId invalid", async () => {
    const req = {
      params: { skugrId: "bad" },
      query: { dateFrom: "2026-06-01", dateTo: "2026-06-01" },
    } as unknown as Request;
    await getSkugrSliceExcelController(req, res);
    expect(responseStatus.code).toBe(400);
  });

  it("404 when skugr not found", async () => {
    const req = {
      params: { skugrId: "507f1f77bcf86cd799439011" },
      query: { dateFrom: "2026-06-01", dateTo: "2026-06-01" },
    } as unknown as Request;
    await getSkugrSliceExcelController(req, res);
    expect(responseStatus.code).toBe(404);
  });

  it("404 when group has no skus with productId", async () => {
    const skugr = await Skugr.create({
      konkName: "x",
      prodName: "y",
      title: "T",
      url: "https://e.com/g",
      isSliced: true,
      skus: [],
    });
    const req = {
      params: { skugrId: skugr._id.toString() },
      query: { dateFrom: "2026-06-01", dateTo: "2026-06-01" },
    } as unknown as Request;
    await getSkugrSliceExcelController(req, res);
    expect(responseStatus.code).toBe(404);
  });

  it("200 sends excel buffer and headers", async () => {
    const sku = await Sku.create({
      konkName: "gr-ex",
      prodName: "pr",
      productId: "gr-ex-1",
      title: "Item",
      url: "https://e.com/i",
    });
    const skugr = await Skugr.create({
      konkName: "gr-ex",
      prodName: "pr",
      title: "Grp",
      url: "https://e.com/g",
      isSliced: true,
      skus: [sku._id],
    });
    await SkuSlice.create({
      konkName: "gr-ex",
      date: new Date("2026-06-01T00:00:00.000Z"),
      data: { "gr-ex-1": { stock: 1, price: 5 } },
    });

    const req = {
      params: { skugrId: skugr._id.toString() },
      query: { dateFrom: "2026-06-01", dateTo: "2026-06-01" },
    } as unknown as Request;
    await getSkugrSliceExcelController(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseHeaders["Content-Type"]).toBe(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    expect(String(responseHeaders["Content-Disposition"])).toContain(
      "attachment",
    );
    expect(Buffer.isBuffer(responseBody)).toBe(true);
    expect((responseBody as Buffer).length).toBeGreaterThan(0);
  });
});

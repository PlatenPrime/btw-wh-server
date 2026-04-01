import type { Request, Response } from "express";
import { beforeEach, describe, expect, it } from "vitest";
import { Sku } from "../../../../skus/models/Sku.js";
import { Skugr } from "../../../../skugrs/models/Skugr.js";
import { SkuSlice } from "../../../models/SkuSlice.js";
import { getSkugrDailySummaryController } from "../getSkugrDailySummaryController.js";

describe("getSkugrDailySummaryController", () => {
  let res: Response;
  let responseStatus: { code?: number };
  let responseJson: Record<string, unknown>;

  beforeEach(async () => {
    await Sku.deleteMany({});
    await Skugr.deleteMany({});
    await SkuSlice.deleteMany({});
    responseStatus = {};
    responseJson = {};
    res = {
      status(code: number) {
        responseStatus.code = code;
        return this;
      },
      json(data: unknown) {
        responseJson = data as Record<string, unknown>;
        return this;
      },
    } as unknown as Response;
  });

  it("400 for invalid skugrId", async () => {
    const req = {
      params: { skugrId: "not-id" },
      query: { dateFrom: "2026-06-01", dateTo: "2026-06-02" },
    } as unknown as Request;
    await getSkugrDailySummaryController(req, res);
    expect(responseStatus.code).toBe(400);
  });

  it("200 returns aggregated data", async () => {
    const sku = await Sku.create({
      konkName: "dc-k",
      prodName: "dc-p",
      productId: "dc-1",
      title: "One",
      url: "https://e.com/1",
    });
    const skugr = await Skugr.create({
      konkName: "dc-k",
      prodName: "dc-p",
      title: "Grp",
      url: "https://e.com/g",
      isSliced: true,
      skus: [sku._id],
    });
    const d = new Date("2026-07-01T00:00:00.000Z");
    await SkuSlice.create({
      konkName: "dc-k",
      date: d,
      data: { "dc-1": { stock: 7, price: 3 } },
    });

    const req = {
      params: { skugrId: skugr._id.toString() },
      query: { dateFrom: "2026-07-01", dateTo: "2026-07-01" },
    } as unknown as Request;
    await getSkugrDailySummaryController(req, res);

    expect(responseStatus.code).toBe(200);
    expect(Array.isArray(responseJson.data)).toBe(true);
    expect((responseJson.data as unknown[])[0]).toMatchObject({
      stock: 7,
      sales: 0,
      revenue: 0,
    });
  });
});

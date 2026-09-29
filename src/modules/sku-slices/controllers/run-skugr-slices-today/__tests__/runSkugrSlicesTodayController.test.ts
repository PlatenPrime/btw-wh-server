import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Sku } from "../../../../skus/models/Sku.js";
import { Skugr } from "../../../../skugrs/models/Skugr.js";
import { SkuSlice } from "../../../models/SkuSlice.js";
import { runSkugrSlicesTodayController } from "../runSkugrSlicesTodayController.js";
import {
  clearSkugrSliceRunsForTests,
  tryAcquireSkugrSliceRun,
} from "../utils/skugrSliceRunStatus.js";

vi.mock("../../../../skus/utils/getSkuStockDataUtil.js", () => ({
  getSkuStockDataUtil: vi.fn().mockResolvedValue({ stock: 5, price: 10 }),
  UNSUPPORTED_KONK_CODE: "UNSUPPORTED_KONK",
}));
vi.mock("../../../../../utils/delay.js", () => ({
  delay: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../../../../../utils/jitterMs.js", () => ({
  jitterMs: vi.fn((min: number) => min),
}));

describe("runSkugrSlicesTodayController", () => {
  let res: Response;
  let responseJson: Record<string, unknown>;
  let responseStatus: { code?: number };

  beforeEach(async () => {
    await Sku.deleteMany({});
    await Skugr.deleteMany({});
    await SkuSlice.deleteMany({});
    clearSkugrSliceRunsForTests();
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

  it("400 for invalid skugrId", async () => {
    const req = { params: { skugrId: "bad" } } as unknown as Request;
    await runSkugrSlicesTodayController(req, res);
    expect(responseStatus.code).toBe(400);
  });

  it("404 when skugr not found", async () => {
    const req = {
      params: { skugrId: "507f1f77bcf86cd799439011" },
    } as unknown as Request;
    await runSkugrSlicesTodayController(req, res);
    expect(responseStatus.code).toBe(404);
  });

  it("409 when run already active", async () => {
    const skugr = await Skugr.create({
      konkName: "perfect",
      prodName: "pd",
      title: "G",
      url: "https://e.com/g",
      skus: [],
    });
    const id = skugr._id.toString();
    expect(tryAcquireSkugrSliceRun(id)).toBe(true);

    const req = { params: { skugrId: id } } as unknown as Request;
    await runSkugrSlicesTodayController(req, res);
    expect(responseStatus.code).toBe(409);
  });

  it("200 runs scrape for skugr skus", async () => {
    const sku = await Sku.create({
      konkName: "perfect",
      prodName: "pd",
      productId: "perfect-run",
      title: "T",
      url: "https://e.com/1",
    });
    const skugr = await Skugr.create({
      konkName: "perfect",
      prodName: "pd",
      title: "G",
      url: "https://e.com/g",
      skus: [sku._id],
    });

    const req = {
      params: { skugrId: skugr._id.toString() },
      user: undefined,
    } as unknown as Request;
    await runSkugrSlicesTodayController(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseJson.message).toBe("Skugr sku slices for today completed");
    const data = responseJson.data as {
      total: number;
      count: number;
      konkName: string;
    };
    expect(data.konkName).toBe("perfect");
    expect(data.total).toBe(1);
    expect(data.count).toBe(1);
  });
});

import { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Sku } from "../../models/Sku.js";

vi.mock("../../utils/getSkuStockDataUtil.js", () => ({
  getSkuStockDataUtil: vi.fn(),
  UNSUPPORTED_KONK_CODE: "UNSUPPORTED_KONK",
}));

import {
  getSkuStockDataUtil,
  UNSUPPORTED_KONK_CODE,
} from "../../utils/getSkuStockDataUtil.js";
import { getSkuStockDataController } from "../get-sku-stock/getSkuStockDataController.js";

const mockGetStock = vi.mocked(getSkuStockDataUtil);

describe("getSkuStockDataController", () => {
  let res: Response;
  let responseJson: Record<string, unknown>;
  let responseStatus: { code?: number };

  beforeEach(async () => {
    await Sku.deleteMany({});
    mockGetStock.mockReset();
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

  it("400 when id invalid", async () => {
    const req = { params: { id: "bad" } } as unknown as Request;
    await getSkuStockDataController(req, res);
    expect(responseStatus.code).toBe(400);
  });

  it("400 when konk unsupported", async () => {
    const sku = await Sku.create({
      konkName: "x",
      prodName: "p",
      productId: "x-1",
      title: "T",
      url: "https://ex.com/x",
    });
    const err = new Error("unsupported") as Error & { code?: string };
    err.code = UNSUPPORTED_KONK_CODE;
    mockGetStock.mockRejectedValue(err);

    const req = {
      params: { id: sku._id.toString() },
    } as unknown as Request;
    await getSkuStockDataController(req, res);
    expect(responseStatus.code).toBe(400);
    expect(responseJson.message).toBe("Unsupported competitor for stock");
  });

  it("404 when sku not found", async () => {
    mockGetStock.mockResolvedValue(null);
    const req = {
      params: { id: "000000000000000000000000" },
    } as unknown as Request;
    await getSkuStockDataController(req, res);
    expect(responseStatus.code).toBe(404);
    expect(responseJson.message).toBe("Sku not found");
  });

  it("404 when stock and price are -1", async () => {
    mockGetStock.mockResolvedValue({ stock: -1, price: -1 });
    const req = {
      params: { id: "000000000000000000000001" },
    } as unknown as Request;
    await getSkuStockDataController(req, res);
    expect(responseStatus.code).toBe(404);
    expect(responseJson.message).toBe("Товар не найден или данные недоступны");
  });

  it("200 returns stock data", async () => {
    mockGetStock.mockResolvedValue({ stock: 10, price: 50 });
    const req = {
      params: { id: "000000000000000000000002" },
    } as unknown as Request;
    await getSkuStockDataController(req, res);
    expect(responseStatus.code).toBe(200);
    expect(responseJson.data).toEqual({ stock: 10, price: 50 });
  });

  it("500 when util throws non-unsupported error", async () => {
    mockGetStock.mockRejectedValue(new Error("Network error"));
    const req = {
      params: { id: "000000000000000000000003" },
    } as unknown as Request;
    await getSkuStockDataController(req, res);
    expect(responseStatus.code).toBe(500);
    expect(responseJson.message).toBe("Server error");
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { putAirClientSkuSliceController } from "../putAirClientSkuSliceController.js";

vi.mock("../utils/putAirClientSkuSliceUtil.js", () => ({
  putAirClientSkuSliceUtil: vi.fn(),
}));

import { putAirClientSkuSliceUtil } from "../utils/putAirClientSkuSliceUtil.js";

describe("putAirClientSkuSliceController", () => {
  const skuId = "507f1f77bcf86cd799439011";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("400 on validation error", async () => {
    const req = { params: { skuId: "bad" }, body: {} } as never;
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

    await putAirClientSkuSliceController(req, res as never);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(putAirClientSkuSliceUtil).not.toHaveBeenCalled();
  });

  it("404 when util reports SKU_NOT_FOUND", async () => {
    vi.mocked(putAirClientSkuSliceUtil).mockResolvedValue({
      ok: false,
      code: "SKU_NOT_FOUND",
      message: "Sku not found",
    });

    const req = {
      params: { skuId },
      body: {
        sourceUrl: "https://airballoons.com.ua/ua/product/x",
        html: "<html>ok</html>",
      },
    } as never;
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

    await putAirClientSkuSliceController(req, res as never);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("422 when util reports PARSE_FAILED", async () => {
    vi.mocked(putAirClientSkuSliceUtil).mockResolvedValue({
      ok: false,
      code: "PARSE_FAILED",
      message: "HTML did not contain valid stock/price",
    });

    const req = {
      params: { skuId },
      body: {
        sourceUrl: "https://airballoons.com.ua/ua/product/x",
        html: "<html>ok</html>",
      },
    } as never;
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

    await putAirClientSkuSliceController(req, res as never);

    expect(res.status).toHaveBeenCalledWith(422);
  });

  it("200 on saved", async () => {
    const date = new Date("2026-07-26T00:00:00.000Z");
    vi.mocked(putAirClientSkuSliceUtil).mockResolvedValue({
      ok: true,
      status: "saved",
      date,
      productId: "air-1",
      stock: 3,
      price: 1.5,
    });

    const req = {
      params: { skuId },
      body: {
        sourceUrl: "https://airballoons.com.ua/ua/product/x",
        html: "<html>ok</html>",
      },
    } as never;
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

    await putAirClientSkuSliceController(req, res as never);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Air client sku slice saved successfully",
      data: {
        status: "saved",
        date,
        productId: "air-1",
        stock: 3,
        price: 1.5,
      },
    });
  });
});

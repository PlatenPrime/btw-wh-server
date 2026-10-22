import { beforeEach, describe, expect, it, vi } from "vitest";
import { correctBalunBandSpikeController } from "../correctBalunBandSpikeController.js";

vi.mock("../utils/correctBalunBandSpikeUtil.js", () => ({
  correctBalunBandSpikeUtil: vi.fn(),
}));

import { correctBalunBandSpikeUtil } from "../utils/correctBalunBandSpikeUtil.js";

describe("correctBalunBandSpikeController", () => {
  const skuId = "507f1f77bcf86cd799439011";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("400 on validation error", async () => {
    const req = { params: { skuId: "bad" }, body: {} } as never;
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

    await correctBalunBandSpikeController(req, res as never);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(correctBalunBandSpikeUtil).not.toHaveBeenCalled();
  });

  it("400 when util reports NOT_BALUN", async () => {
    vi.mocked(correctBalunBandSpikeUtil).mockResolvedValue({
      ok: false,
      code: "NOT_BALUN",
      message: "Sku competitor is not balun",
    });

    const req = {
      params: { skuId },
      body: { dateFrom: "2026-10-16", dateTo: "2026-10-19" },
    } as never;
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

    await correctBalunBandSpikeController(req, res as never);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Sku competitor is not balun" });
  });

  it("404 when util reports SKU_NOT_FOUND", async () => {
    vi.mocked(correctBalunBandSpikeUtil).mockResolvedValue({
      ok: false,
      code: "SKU_NOT_FOUND",
      message: "Sku not found",
    });

    const req = {
      params: { skuId },
      body: { dateFrom: "2026-10-16", dateTo: "2026-10-19" },
    } as never;
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

    await correctBalunBandSpikeController(req, res as never);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("200 preview", async () => {
    vi.mocked(correctBalunBandSpikeUtil).mockResolvedValue({
      ok: true,
      productId: "balun-1",
      window: { dateFrom: "2026-10-16", dateTo: "2026-10-19" },
      band: { min: 9000, max: 10000 },
      patches: [{ date: "2026-10-16", from: 9937, to: 59 }],
      skipped: [],
      applied: false,
    });

    const req = {
      params: { skuId },
      body: { dateFrom: "2026-10-16", dateTo: "2026-10-19" },
    } as never;
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

    await correctBalunBandSpikeController(req, res as never);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Balun band spike correction preview",
      data: {
        productId: "balun-1",
        window: { dateFrom: "2026-10-16", dateTo: "2026-10-19" },
        band: { min: 9000, max: 10000 },
        patches: [{ date: "2026-10-16", from: 9937, to: 59 }],
        skipped: [],
        applied: false,
      },
    });
  });

  it("200 apply", async () => {
    vi.mocked(correctBalunBandSpikeUtil).mockResolvedValue({
      ok: true,
      productId: "balun-1",
      window: { dateFrom: "2026-10-16", dateTo: "2026-10-19" },
      band: { min: 9000, max: 10000 },
      patches: [{ date: "2026-10-16", from: 9937, to: 59 }],
      skipped: [],
      applied: true,
    });

    const req = {
      params: { skuId },
      body: { dateFrom: "2026-10-16", dateTo: "2026-10-19", apply: true },
    } as never;
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

    await correctBalunBandSpikeController(req, res as never);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Balun band spike corrected successfully",
        data: expect.objectContaining({ applied: true }),
      }),
    );
  });
});

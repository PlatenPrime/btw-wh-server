import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import mongoose from "mongoose";

vi.mock("../utils/correctBandSpikeUtil.js", () => ({
  correctBandSpikeUtil: vi.fn(),
}));

import { correctBandSpikeUtil } from "../utils/correctBandSpikeUtil.js";
import { correctBandSpikeController } from "../correctBandSpikeController.js";

const skuId = new mongoose.Types.ObjectId().toString();

function mockRes() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
  return res as unknown as Response & {
    status: ReturnType<typeof vi.fn>;
    json: ReturnType<typeof vi.fn>;
  };
}

describe("correctBandSpikeController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 on validation error", async () => {
    const res = mockRes();
    await correctBandSpikeController(
      { params: { skuId: "bad" }, body: {} } as unknown as Request,
      res,
    );
    expect(res.status).toHaveBeenCalledWith(400);
    expect(correctBandSpikeUtil).not.toHaveBeenCalled();
  });

  it("returns 404 when sku missing", async () => {
    vi.mocked(correctBandSpikeUtil).mockResolvedValue({
      ok: false,
      code: "SKU_NOT_FOUND",
      message: "Sku not found",
    });
    const res = mockRes();
    await correctBandSpikeController(
      {
        params: { skuId },
        body: {
          dateFrom: "2026-09-14",
          dateTo: "2026-09-16",
          stockMin: 9000,
          stockMax: 11000,
        },
      } as unknown as Request,
      res,
    );
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("returns preview payload", async () => {
    vi.mocked(correctBandSpikeUtil).mockResolvedValue({
      ok: true,
      konkName: "balun",
      productId: "b-1",
      window: { dateFrom: "2026-09-14", dateTo: "2026-09-16" },
      band: { min: 9000, max: 11000 },
      patches: [{ date: "2026-09-15", from: 9937, to: 59 }],
      skipped: [],
      applied: false,
    });
    const res = mockRes();
    await correctBandSpikeController(
      {
        params: { skuId },
        body: {
          dateFrom: "2026-09-14",
          dateTo: "2026-09-16",
          stockMin: 9000,
          stockMax: 11000,
        },
      } as unknown as Request,
      res,
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Band spike correction preview",
      data: {
        konkName: "balun",
        productId: "b-1",
        window: { dateFrom: "2026-09-14", dateTo: "2026-09-16" },
        band: { min: 9000, max: 11000 },
        patches: [{ date: "2026-09-15", from: 9937, to: 59 }],
        skipped: [],
        applied: false,
      },
    });
  });

  it("returns success message when applied", async () => {
    vi.mocked(correctBandSpikeUtil).mockResolvedValue({
      ok: true,
      konkName: "svbum",
      productId: "sv-1",
      window: { dateFrom: "2026-09-14", dateTo: "2026-09-14" },
      band: { min: 900000, max: 9999999 },
      patches: [{ date: "2026-09-14", from: 1_500_000, to: 80 }],
      skipped: [],
      applied: true,
    });
    const res = mockRes();
    await correctBandSpikeController(
      {
        params: { skuId },
        body: {
          dateFrom: "2026-09-14",
          dateTo: "2026-09-14",
          stockMin: 900000,
          stockMax: 9999999,
          apply: true,
        },
      } as unknown as Request,
      res,
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Band spike corrected successfully" }),
    );
  });
});

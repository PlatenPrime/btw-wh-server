import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";

vi.mock("../utils/discoverBandSpikeUtil.js", () => ({
  discoverBandSpikeUtil: vi.fn(),
}));

import { discoverBandSpikeUtil } from "../utils/discoverBandSpikeUtil.js";
import { discoverBandSpikeController } from "../discoverBandSpikeController.js";

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

describe("discoverBandSpikeController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 on validation error", async () => {
    const res = mockRes();
    await discoverBandSpikeController({ body: {} } as Request, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(discoverBandSpikeUtil).not.toHaveBeenCalled();
  });

  it("returns 200 with discovery data", async () => {
    vi.mocked(discoverBandSpikeUtil).mockResolvedValue({
      konkName: "balun",
      window: { dateFrom: "2026-09-01", dateTo: "2026-09-30" },
      band: { min: 9000, max: 11000 },
      items: [
        {
          skuId: "abc",
          productId: "p1",
          title: "T",
          runs: [{ dateFrom: "2026-09-14", dateTo: "2026-09-15", peakStock: 9937 }],
        },
      ],
    });
    const res = mockRes();
    await discoverBandSpikeController(
      {
        body: {
          konkName: "balun",
          stockMin: 9000,
          stockMax: 11000,
          dateFrom: "2026-09-01",
          dateTo: "2026-09-30",
        },
      } as Request,
      res,
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: "Band spike candidates discovered successfully",
      data: expect.objectContaining({ konkName: "balun", items: expect.any(Array) }),
    });
  });
});

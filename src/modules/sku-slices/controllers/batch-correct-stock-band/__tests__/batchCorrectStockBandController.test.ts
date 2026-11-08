import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import { batchCorrectStockBandController } from "../batchCorrectStockBandController.js";

vi.mock("../../../../apitasks/controllers/create-api-task/utils/createApiTaskUtil.js", () => ({
  createApiTaskUtil: vi.fn(),
}));

import { createApiTaskUtil } from "../../../../apitasks/controllers/create-api-task/utils/createApiTaskUtil.js";

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

describe("batchCorrectStockBandController", () => {
  beforeEach(() => {
    vi.mocked(createApiTaskUtil).mockReset();
  });

  it("enqueues api task and returns 202", async () => {
    vi.mocked(createApiTaskUtil).mockResolvedValue({
      ok: true,
      data: {
        taskId: "t1",
        kind: "sku-slices.stock-band.batch-correct",
        status: "queued",
        phase: "queued",
        progress: 0,
        queuePosition: 1,
        expiresAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        pollIntervalMs: 1000,
      },
    } as never);

    const req = {
      user: { id: "u1", role: "ADMIN" },
      params: { bandId: "507f1f77bcf86cd799439011" },
      body: {
        dateFrom: "2026-10-26",
        dateTo: "2026-11-08",
        productIds: ["balun-1"],
      },
    } as unknown as Request;
    const res = mockRes();

    await batchCorrectStockBandController(req, res);

    expect(createApiTaskUtil).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: "sku-slices.stock-band.batch-correct",
        userId: "u1",
      }),
    );
    expect(res.status).toHaveBeenCalledWith(202);
  });

  it("returns 400 on validation error", async () => {
    const req = {
      user: { id: "u1", role: "ADMIN" },
      params: { bandId: "507f1f77bcf86cd799439011" },
      body: { dateFrom: "2026-10-26", dateTo: "2026-11-08", productIds: [] },
    } as unknown as Request;
    const res = mockRes();

    await batchCorrectStockBandController(req, res);

    expect(createApiTaskUtil).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

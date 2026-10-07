import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RoleType } from "../../../../../constants/roles.js";

vi.mock(
  "../../../../apitasks/controllers/create-api-task/utils/createApiTaskUtil.js",
  () => ({
    createApiTaskUtil: vi.fn(),
  })
);

import { createApiTaskUtil } from "../../../../apitasks/controllers/create-api-task/utils/createApiTaskUtil.js";
import { postSkuSlicePostCorrectionsController } from "../postSkuSlicePostCorrectionsController.js";

describe("postSkuSlicePostCorrectionsController", () => {
  const json = vi.fn();
  const status = vi.fn(() => ({ json }));
  const res = { status, json } as unknown as Response;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createApiTaskUtil).mockResolvedValue({
      ok: true,
      status: 202,
      data: {
        taskId: "task-1",
        kind: "sku-slices.post-corrections.run",
        status: "queued",
        phase: "queued",
        progress: 0,
        queuePosition: 0,
        expiresAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        pollIntervalMs: 1000,
      },
    });
  });

  it("returns 202 when task is accepted", async () => {
    const req = {
      user: { id: "u1", role: RoleType.ADMIN },
      body: {
        dateFrom: "2026-04-01",
        dateTo: "2026-04-03",
        apply: true,
      },
    } as unknown as Request;

    await postSkuSlicePostCorrectionsController(req, res);

    expect(createApiTaskUtil).toHaveBeenCalledWith({
      kind: "sku-slices.post-corrections.run",
      params: expect.objectContaining({
        dateFrom: new Date("2026-04-01T00:00:00.000Z"),
        apply: true,
      }),
      userId: "u1",
      userRole: RoleType.ADMIN,
    });
    expect(status).toHaveBeenCalledWith(202);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Api task accepted" })
    );
  });

  it("returns 400 on validation error", async () => {
    const req = {
      user: { id: "u1", role: RoleType.ADMIN },
      body: { dateFrom: "2026-04-05", dateTo: "2026-04-01" },
    } as unknown as Request;

    await postSkuSlicePostCorrectionsController(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(createApiTaskUtil).not.toHaveBeenCalled();
  });
});

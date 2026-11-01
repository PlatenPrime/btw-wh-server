import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSelectionSkusPieDataController } from "../getSelectionSkusPieDataController.js";
import { getSelectionSkusPieDataUtil } from "../utils/getSelectionSkusPieDataUtil.js";

vi.mock("../utils/getSelectionSkusPieDataUtil.js");

describe("getSelectionSkusPieDataController", () => {
  let res: Response;
  let responseStatus: { code?: number };
  let responseJson: Record<string, unknown>;

  beforeEach(() => {
    vi.clearAllMocks();
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

  it("400 when body invalid", async () => {
    const req = {
      body: {
        skuIds: [],
        dateFrom: "2026-06-01",
        dateTo: "2026-06-02",
      },
    } as unknown as Request;
    await getSelectionSkusPieDataController(req, res);
    expect(responseStatus.code).toBe(400);
  });

  it("404 when util returns ok false", async () => {
    vi.mocked(getSelectionSkusPieDataUtil).mockResolvedValue({ ok: false });
    const req = {
      body: {
        skuIds: ["64b0c0c0c0c0c0c0c0c0c0c0"],
        dateFrom: "2026-06-01",
        dateTo: "2026-06-02",
      },
    } as unknown as Request;
    await getSelectionSkusPieDataController(req, res);
    expect(responseStatus.code).toBe(404);
  });

  it("200 returns pie data and all", async () => {
    vi.mocked(getSelectionSkusPieDataUtil).mockResolvedValue({
      ok: true,
      data: {
        "64b0c0c0c0c0c0c0c0c0c0c0": {
          title: "Item",
          konkName: "air",
          productId: "air-1",
          salesPcs: 2,
          salesUah: 20,
          sharePcs: 100,
          shareUah: 100,
        },
      },
      all: { title: "Всі обрані", salesPcs: 2, salesUah: 20 },
    });
    const req = {
      body: {
        skuIds: ["64b0c0c0c0c0c0c0c0c0c0c0"],
        dateFrom: "2026-06-01",
        dateTo: "2026-06-02",
      },
    } as unknown as Request;
    await getSelectionSkusPieDataController(req, res);
    expect(responseStatus.code).toBe(200);
    expect(responseJson.data).toBeDefined();
    expect(responseJson.all).toBeDefined();
  });
});

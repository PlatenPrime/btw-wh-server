import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSkugrSkusSalesController } from "../getSkugrSkusSalesController.js";
import { getSkugrSkusSalesUtil } from "../utils/getSkugrSkusSalesUtil.js";

vi.mock("../utils/getSkugrSkusSalesUtil.js");

describe("getSkugrSkusSalesController", () => {
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

  it("400 when dateFrom after dateTo", async () => {
    const req = {
      params: { skugrId: "507f1f77bcf86cd799439011" },
      query: {
        dateFrom: "2026-02-10",
        dateTo: "2026-02-01",
      },
    } as unknown as Request;
    await getSkugrSkusSalesController(req, res);
    expect(responseStatus.code).toBe(400);
  });

  it("400 when skugrId invalid", async () => {
    const req = {
      params: { skugrId: "bad-id" },
      query: {
        dateFrom: "2026-04-01",
        dateTo: "2026-04-02",
      },
    } as unknown as Request;
    await getSkugrSkusSalesController(req, res);
    expect(responseStatus.code).toBe(400);
  });

  it("404 when util returns ok false", async () => {
    vi.mocked(getSkugrSkusSalesUtil).mockResolvedValue({ ok: false });
    const req = {
      params: { skugrId: "507f1f77bcf86cd799439011" },
      query: {
        dateFrom: "2026-04-01",
        dateTo: "2026-04-02",
      },
    } as unknown as Request;
    await getSkugrSkusSalesController(req, res);
    expect(responseStatus.code).toBe(404);
    expect(responseJson.message).toBe("Skugr not found");
  });

  it("200 returns data and all from util", async () => {
    vi.mocked(getSkugrSkusSalesUtil).mockResolvedValue({
      ok: true,
      data: [
        {
          skuId: "507f1f77bcf86cd799439012",
          title: "SKU A",
          productId: "p-a",
          salesPcs: 3,
          salesUah: 12.5,
        },
      ],
      all: {
        title: "Усього",
        salesPcs: 3,
        salesUah: 12.5,
      },
    });
    const req = {
      params: { skugrId: "507f1f77bcf86cd799439011" },
      query: {
        dateFrom: "2026-04-01",
        dateTo: "2026-04-01",
      },
    } as unknown as Request;
    await getSkugrSkusSalesController(req, res);
    expect(responseStatus.code).toBe(200);
    expect(responseJson.data).toEqual([
      {
        skuId: "507f1f77bcf86cd799439012",
        title: "SKU A",
        productId: "p-a",
        salesPcs: 3,
        salesUah: 12.5,
      },
    ]);
    expect(responseJson.all).toEqual({
      title: "Усього",
      salesPcs: 3,
      salesUah: 12.5,
    });
  });
});

import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAnalogSalesRangeController } from "../get-analog-sales-range/getAnalogSalesRangeController.js";
import { getAnalogSalesRangeUtil } from "../get-analog-sales-range/utils/getAnalogSalesRangeUtil.js";

vi.mock("../get-analog-sales-range/utils/getAnalogSalesRangeUtil.js");

describe("getAnalogSalesRangeController", () => {
  let res: Response;
  let responseStatus: { code?: number };
  let responseBody: unknown;

  beforeEach(() => {
    responseStatus = {};
    responseBody = null;

    res = {
      status(code: number) {
        responseStatus.code = code;
        return this;
      },
      json(data: unknown) {
        responseBody = data;
        return this;
      },
    } as unknown as Response;

    vi.clearAllMocks();
  });

  it("returns 400 on invalid analogId", async () => {
    const req = {
      params: { analogId: "bad-id" },
      query: { dateFrom: "2026-03-01", dateTo: "2026-03-31" },
    } as unknown as Request;

    await getAnalogSalesRangeController(req, res);

    expect(responseStatus.code).toBe(400);
    expect((responseBody as { message?: string })?.message).toBe("Validation error");
  });

  it("returns 404 when util returns ok: false", async () => {
    vi.mocked(getAnalogSalesRangeUtil).mockResolvedValue({ ok: false });

    const req = {
      params: { analogId: "69a2de17f8a2a9cb9a8a75df" },
      query: { dateFrom: "2026-03-01", dateTo: "2026-03-31" },
    } as unknown as Request;

    await getAnalogSalesRangeController(req, res);

    expect(getAnalogSalesRangeUtil).toHaveBeenCalledTimes(1);
    expect(responseStatus.code).toBe(404);
    expect(responseBody).toEqual({
      message: "Analog not found or analog has no artikul",
    });
  });

  it("returns 200 with sales range on success", async () => {
    const mockData = [
      {
        date: "2026-03-01T00:00:00.000Z",
        sales: 10,
        revenue: 150,
        price: 15,
        isDeliveryDay: false,
      },
    ];
    vi.mocked(getAnalogSalesRangeUtil).mockResolvedValue({
      ok: true,
      data: mockData,
    });

    const req = {
      params: { analogId: "69a2de17f8a2a9cb9a8a75df" },
      query: { dateFrom: "2026-03-01", dateTo: "2026-03-01" },
    } as unknown as Request;

    await getAnalogSalesRangeController(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseBody).toEqual({
      message: "Analog sales range retrieved successfully",
      data: mockData,
    });
  });
});

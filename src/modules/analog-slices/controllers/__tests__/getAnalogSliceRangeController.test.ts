import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAnalogSliceRangeController } from "../get-analog-slice-range/getAnalogSliceRangeController.js";
import { getAnalogSliceRangeUtil } from "../get-analog-slice-range/utils/getAnalogSliceRangeUtil.js";

vi.mock("../get-analog-slice-range/utils/getAnalogSliceRangeUtil.js");

describe("getAnalogSliceRangeController", () => {
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

  it("returns 400 when dateFrom > dateTo", async () => {
    const req = {
      params: { analogId: "69a2de17f8a2a9cb9a8a75df" },
      query: { dateFrom: "2026-03-10", dateTo: "2026-03-01" },
    } as unknown as Request;

    await getAnalogSliceRangeController(req, res);

    expect(responseStatus.code).toBe(400);
    expect((responseBody as { message?: string })?.message).toBe("Validation error");
  });

  it("returns 404 when util returns ok: false", async () => {
    vi.mocked(getAnalogSliceRangeUtil).mockResolvedValue({ ok: false });

    const req = {
      params: { analogId: "69a2de17f8a2a9cb9a8a75df" },
      query: { dateFrom: "2026-03-01", dateTo: "2026-03-31" },
    } as unknown as Request;

    await getAnalogSliceRangeController(req, res);

    expect(getAnalogSliceRangeUtil).toHaveBeenCalledTimes(1);
    expect(responseStatus.code).toBe(404);
    expect(responseBody).toEqual({
      message: "Analog not found or analog has no artikul",
    });
  });

  it("returns 200 with range data on success", async () => {
    const mockData = [
      { date: "2026-03-01T00:00:00.000Z", stock: 1, price: 1.5 },
      { date: "2026-03-02T00:00:00.000Z", stock: 2, price: 1.6 },
    ];
    vi.mocked(getAnalogSliceRangeUtil).mockResolvedValue({
      ok: true,
      data: mockData,
    });

    const req = {
      params: { analogId: "69a2de17f8a2a9cb9a8a75df" },
      query: { dateFrom: "2026-03-01", dateTo: "2026-03-02" },
    } as unknown as Request;

    await getAnalogSliceRangeController(req, res);

    expect(responseStatus.code).toBe(200);
    expect(responseBody).toEqual({
      message: "Analog slice range retrieved successfully",
      data: mockData,
    });
  });
});

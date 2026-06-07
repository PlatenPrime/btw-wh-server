import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAnalogSalesComparisonExcelController } from "../get-analog-sales-comparison-excel/getAnalogSalesComparisonExcelController.js";
import { getAnalogBtradeComparisonRangeUtil } from "../get-analog-btrade-comparison-excel/utils/getAnalogBtradeComparisonRangeUtil.js";
import { buildAnalogSalesComparisonExcel } from "../get-analog-sales-comparison-excel/utils/buildAnalogSalesComparisonExcel.js";

vi.mock(
  "../get-analog-btrade-comparison-excel/utils/getAnalogBtradeComparisonRangeUtil.js",
);
vi.mock(
  "../get-analog-sales-comparison-excel/utils/buildAnalogSalesComparisonExcel.js",
);

describe("getAnalogSalesComparisonExcelController", () => {
  let res: Response;
  let responseStatus: { code?: number };
  let responseHeaders: Record<string, string | number>;
  let responseBody: unknown;

  beforeEach(() => {
    responseStatus = {};
    responseHeaders = {};
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
      send(data: unknown) {
        responseBody = data;
        return this;
      },
      setHeader(name: string, value: string | number) {
        responseHeaders[name] = value;
        return this;
      },
    } as unknown as Response;

    vi.clearAllMocks();
  });

  it("returns 400 on validation error", async () => {
    const req = {
      params: { analogId: "invalid-id" },
      query: { dateFrom: "2026-03-10", dateTo: "2026-03-01" },
    } as unknown as Request;

    await getAnalogSalesComparisonExcelController(req, res);

    expect(responseStatus.code).toBe(400);
    expect((responseBody as { message?: string })?.message).toBe("Validation error");
  });

  it("returns 404 when analog not found or has no artikul", async () => {
    vi.mocked(getAnalogBtradeComparisonRangeUtil).mockResolvedValue({ ok: false });

    const req = {
      params: { analogId: "69a2de17f8a2a9cb9a8a75df" },
      query: { dateFrom: "2026-03-01", dateTo: "2026-03-31" },
    } as unknown as Request;

    await getAnalogSalesComparisonExcelController(req, res);

    expect(getAnalogBtradeComparisonRangeUtil).toHaveBeenCalledTimes(1);
    expect(responseStatus.code).toBe(404);
    expect(responseBody).toEqual({
      message: "Analog not found or analog has no artikul",
    });
  });

  it("returns 200 and Excel buffer on success", async () => {
    const items = [
      {
        date: new Date("2026-03-01T00:00:00.000Z"),
        analogStock: 1,
        analogPrice: 1.5,
        btradeStock: 10,
        btradePrice: 2.0,
      },
    ];
    vi.mocked(getAnalogBtradeComparisonRangeUtil).mockResolvedValue({
      ok: true,
      data: items,
      artikul: "1102-0259",
      artNameUkr: "Тест",
      artAbc: "A",
      producerName: "Producer",
      competitorTitle: "Air",
      recountDays: [],
    });
    const buffer = Buffer.from("excel-data");
    vi.mocked(buildAnalogSalesComparisonExcel).mockResolvedValue({
      buffer,
      fileName: "analog_sales_comparison_1102-0259_2026-03-01_2026-03-01.xlsx",
    });

    const req = {
      params: { analogId: "69a2de17f8a2a9cb9a8a75df" },
      query: { dateFrom: "2026-03-01", dateTo: "2026-03-01" },
    } as unknown as Request;

    await getAnalogSalesComparisonExcelController(req, res);

    expect(buildAnalogSalesComparisonExcel).toHaveBeenCalledTimes(1);
    expect(responseStatus.code).toBe(200);
    expect(responseBody).toBe(buffer);
    expect(responseHeaders["Content-Type"]).toBe(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    expect(responseHeaders["Content-Disposition"]).toContain("attachment");
  });
});

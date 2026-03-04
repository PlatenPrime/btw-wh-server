import { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getAnalogBtradeComparisonExcelController } from "../get-analog-btrade-comparison-excel/getAnalogBtradeComparisonExcelController.js";
import { getAnalogBtradeComparisonRangeUtil } from "../get-analog-btrade-comparison-excel/utils/getAnalogBtradeComparisonRangeUtil.js";
import { buildAnalogBtradeComparisonExcel } from "../get-analog-btrade-comparison-excel/utils/buildAnalogBtradeComparisonExcel.js";

vi.mock(
  "../get-analog-btrade-comparison-excel/utils/getAnalogBtradeComparisonRangeUtil.js"
);
vi.mock(
  "../get-analog-btrade-comparison-excel/utils/buildAnalogBtradeComparisonExcel.js"
);

describe("getAnalogBtradeComparisonExcelController", () => {
  let res: Response;
  let responseStatus: any;
  let responseHeaders: Record<string, string | number>;
  let responseBody: any;

  beforeEach(() => {
    responseStatus = {};
    responseHeaders = {};
    responseBody = null;

    res = {
      status: function (code: number) {
        responseStatus.code = code;
        return this;
      },
      json: function (data: any) {
        responseBody = data;
        return this;
      },
      send: function (data: any) {
        responseBody = data;
        return this;
      },
      setHeader: function (name: string, value: string | number) {
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

    await getAnalogBtradeComparisonExcelController(req, res);

    expect(responseStatus.code).toBe(400);
    expect(responseBody?.message).toBe("Validation error");
  });

  it("returns 404 when analog not found or has no artikul", async () => {
    vi.mocked(getAnalogBtradeComparisonRangeUtil).mockResolvedValue({
      ok: false,
    });

    const req = {
      params: { analogId: "69a2de17f8a2a9cb9a8a75df" },
      query: { dateFrom: "2026-03-01", dateTo: "2026-03-31" },
    } as unknown as Request;

    await getAnalogBtradeComparisonExcelController(req, res);

    expect(getAnalogBtradeComparisonRangeUtil).toHaveBeenCalledTimes(1);
    expect(responseStatus.code).toBe(404);
    expect(responseBody).toEqual({
      message: "Analog not found or analog has no artikul",
    });
  });

  it("returns 200 and Excel buffer on success", async () => {
    vi.mocked(getAnalogBtradeComparisonRangeUtil).mockResolvedValue({
      ok: true,
      artikul: "1102-0259",
      artNameUkr: "Тестовий товар",
      producerName: "Test Producer",
      data: [
        {
          date: new Date("2026-03-01T00:00:00.000Z"),
          analogStock: 1,
          analogPrice: 1.5,
          btradeStock: 10,
          btradePrice: 2.0,
        },
      ],
    });

    const mockBuffer = Buffer.from("excel-data");
    const mockFileName = "analog_btrade_comparison_abc_2026-03-01_2026-03-31.xlsx";

    vi.mocked(buildAnalogBtradeComparisonExcel).mockResolvedValue({
      buffer: mockBuffer,
      fileName: mockFileName,
    });

    const req = {
      params: { analogId: "69a2de17f8a2a9cb9a8a75df" },
      query: { dateFrom: "2026-03-01", dateTo: "2026-03-31" },
    } as unknown as Request;

    await getAnalogBtradeComparisonExcelController(req, res);

    expect(getAnalogBtradeComparisonRangeUtil).toHaveBeenCalledTimes(1);
    expect(buildAnalogBtradeComparisonExcel).toHaveBeenCalledTimes(1);
    expect(responseStatus.code).toBe(200);
    expect(responseHeaders["Content-Type"]).toBe(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    expect(responseHeaders["Content-Disposition"]).toBe(
      `attachment; filename="${mockFileName}"`
    );
    expect(responseBody).toBe(mockBuffer);
  });
});


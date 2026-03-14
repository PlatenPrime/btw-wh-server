import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getKonkBtradeStockComparisonController } from "../get-konk-btrade-stock-comparison/getKonkBtradeStockComparisonController.js";
import { getKonkBtradeStockComparisonUtil } from "../get-konk-btrade-stock-comparison/utils/getKonkBtradeStockComparisonUtil.js";

vi.mock(
  "../get-konk-btrade-stock-comparison/utils/getKonkBtradeStockComparisonUtil.js",
);

describe("getKonkBtradeStockComparisonController", () => {
  let res: Response;
  let responseStatus: any;
  let responseBody: any;

  beforeEach(() => {
    responseStatus = {};
    responseBody = null;

    res = {
      status(code: number) {
        responseStatus.code = code;
        return this;
      },
      json(data: any) {
        responseBody = data;
        return this;
      },
    } as unknown as Response;

    vi.clearAllMocks();
  });

  it("returns 400 on validation error (empty konk)", async () => {
    const req = {
      query: {
        konk: "",
        prod: "gemar",
        dateFrom: "2026-03-01",
        dateTo: "2026-03-10",
      },
    } as unknown as Request;

    await getKonkBtradeStockComparisonController(req, res);

    expect(responseStatus.code).toBe(400);
    expect(responseBody?.message).toBe("Validation error");
  });

  it("returns 400 when dateFrom > dateTo", async () => {
    const req = {
      query: {
        konk: "air",
        prod: "gemar",
        dateFrom: "2026-03-10",
        dateTo: "2026-03-01",
      },
    } as unknown as Request;

    await getKonkBtradeStockComparisonController(req, res);

    expect(responseStatus.code).toBe(400);
    expect(responseBody?.message).toBe("Validation error");
  });

  it("returns 404 when util returns ok: false", async () => {
    vi.mocked(getKonkBtradeStockComparisonUtil).mockResolvedValue({
      ok: false,
    });

    const req = {
      query: {
        konk: "air",
        prod: "gemar",
        dateFrom: "2026-03-01",
        dateTo: "2026-03-31",
      },
    } as unknown as Request;

    await getKonkBtradeStockComparisonController(req, res);

    expect(getKonkBtradeStockComparisonUtil).toHaveBeenCalledTimes(1);
    expect(responseStatus.code).toBe(404);
    expect(responseBody).toEqual({
      message: "Analogs not found for provided konk/prod",
    });
  });

  it("returns 200 with days and summary on success", async () => {
    const mockData = {
      days: [
        {
          date: "2026-03-01T00:00:00.000Z",
          competitorStock: 150,
          btradeStock: 300,
        },
        {
          date: "2026-03-02T00:00:00.000Z",
          competitorStock: 130,
          btradeStock: 275,
        },
      ],
      summary: {
        firstDayCompetitorStock: 150,
        lastDayCompetitorStock: 130,
        firstDayBtradeStock: 300,
        lastDayBtradeStock: 275,
        diffCompetitorStock: -20,
        diffBtradeStock: -25,
        diffCompetitorStockPct: -13.33,
        diffBtradeStockPct: -8.33,
      },
    };

    vi.mocked(getKonkBtradeStockComparisonUtil).mockResolvedValue({
      ok: true,
      data: mockData,
    });

    const req = {
      query: {
        konk: "air",
        prod: "gemar",
        dateFrom: "2026-03-01",
        dateTo: "2026-03-02",
      },
    } as unknown as Request;

    await getKonkBtradeStockComparisonController(req, res);

    expect(getKonkBtradeStockComparisonUtil).toHaveBeenCalledTimes(1);
    expect(responseStatus.code).toBe(200);
    expect(responseBody).toEqual({
      message: "Stock comparison data retrieved successfully",
      data: mockData,
    });
  });
});

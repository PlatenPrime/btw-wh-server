import type { Request, Response } from "express";
import { getArtStockChartDataSchema } from "./schemas/getArtStockChartDataSchema.js";
import { getArtStockChartDataUtil } from "./utils/getArtStockChartDataUtil.js";

function firstQuery(q: Request["query"], key: string): string | undefined {
  const v = q[key];
  return Array.isArray(v) ? (v[0] as string) : (v as string | undefined);
}

/**
 * @desc    Данные для графика остатков по артикулу
 * @route   GET /api/art-chart-reports/artikul/:artikul/stock?dateFrom=&dateTo=
 */
export const getArtStockChartDataController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const parseResult = getArtStockChartDataSchema.safeParse({
    artikul: req.params.artikul,
    dateFrom: firstQuery(req.query, "dateFrom"),
    dateTo: firstQuery(req.query, "dateTo"),
  });

  if (!parseResult.success) {
    res.status(400).json({
      message: "Validation error",
      errors: parseResult.error.errors,
    });
    return;
  }

  const result = await getArtStockChartDataUtil(parseResult.data);
  if (!result.ok) {
    res.status(404).json({
      message: "Art not found for provided artikul",
    });
    return;
  }

  res.status(200).json({
    message: "Art stock chart data retrieved successfully",
    data: result.data,
  });
};

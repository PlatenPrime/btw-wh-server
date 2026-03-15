import type { Request, Response } from "express";
import { getKonkBtradeSalesComparisonSchema } from "./schemas/getKonkBtradeSalesComparisonSchema.js";
import { getKonkBtradeSalesComparisonUtil } from "./utils/getKonkBtradeSalesComparisonUtil.js";

/**
 * @desc    Получить агрегированные продажи и выручку конкурента vs Btrade по дням за период (для графиков)
 * @route   GET /api/analog-slices/konk-btrade/sales-comparison?konk=...&prod=...&dateFrom=...&dateTo=...
 */
export const getKonkBtradeSalesComparisonController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const q = req.query;
  const parseResult = getKonkBtradeSalesComparisonSchema.safeParse({
    konk: Array.isArray(q.konk) ? q.konk[0] : q.konk,
    prod: Array.isArray(q.prod) ? q.prod[0] : q.prod,
    dateFrom: Array.isArray(q.dateFrom) ? q.dateFrom[0] : q.dateFrom,
    dateTo: Array.isArray(q.dateTo) ? q.dateTo[0] : q.dateTo,
    abc: Array.isArray(q.abc) ? q.abc[0] : q.abc,
    sortBy: Array.isArray(q.sortBy) ? q.sortBy[0] : q.sortBy,
  });

  if (!parseResult.success) {
    res.status(400).json({
      message: "Validation error",
      errors: parseResult.error.errors,
    });
    return;
  }

  const result = await getKonkBtradeSalesComparisonUtil(parseResult.data);
  if (!result.ok) {
    res.status(404).json({
      message: "Analogs not found for provided konk/prod",
    });
    return;
  }

  res.status(200).json({
    message: "Sales comparison data retrieved successfully",
    data: result.data,
  });
};

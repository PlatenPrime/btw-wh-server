import { Request, Response } from "express";
import { getSkugrDailySummarySchema } from "./schemas/getSkugrDailySummarySchema.js";
import { getSkugrDailySummaryUtil } from "./utils/getSkugrDailySummaryUtil.js";

/**
 * @desc    Дневные агрегаты по товарной группе: остатки, продажи (шт.), выручка
 * @route   GET /api/sku-slices/skugr/:skugrId/daily-summary?dateFrom=&dateTo=
 */
export const getSkugrDailySummaryController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const parseResult = getSkugrDailySummarySchema.safeParse({
    skugrId: req.params.skugrId,
    dateFrom: req.query.dateFrom,
    dateTo: req.query.dateTo,
  });
  if (!parseResult.success) {
    res.status(400).json({
      message: "Validation error",
      errors: parseResult.error.errors,
    });
    return;
  }

  const result = await getSkugrDailySummaryUtil(parseResult.data);
  if (!result.ok) {
    res.status(404).json({
      message:
        "Skugr not found or group has no skus with productId for reporting",
    });
    return;
  }

  res.status(200).json({
    message: "Skugr daily summary retrieved successfully",
    data: result.data,
  });
};

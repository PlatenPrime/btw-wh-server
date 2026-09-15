import { Request, Response } from "express";
import { getPackFlipReviewSchema } from "./schemas/getPackFlipReviewSchema.js";
import { getPackFlipReviewUtil } from "./utils/getPackFlipReviewUtil.js";

/**
 * @desc    Проверка pack-flip скачков stock/price по конкуренту и диапазону дат (без записи)
 * @route   GET /api/sku-slices/pack-flips?konkName=&dateFrom=&dateTo=
 */
export const getPackFlipReviewController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const parseResult = getPackFlipReviewSchema.safeParse(req.query);
  if (!parseResult.success) {
    res.status(400).json({
      message: "Validation error",
      errors: parseResult.error.errors,
    });
    return;
  }

  const data = await getPackFlipReviewUtil(parseResult.data);
  res.status(200).json({
    message: "Pack-flip review retrieved successfully",
    data,
  });
};

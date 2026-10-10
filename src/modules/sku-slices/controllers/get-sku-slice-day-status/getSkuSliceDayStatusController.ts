import { Request, Response } from "express";
import { getSkuSliceDayStatusSchema } from "./schemas/getSkuSliceDayStatusSchema.js";
import { getSkuSliceDayStatusUtil } from "./utils/getSkuSliceDayStatusUtil.js";

/**
 * @desc    Статус дневного прогона среза (DayMeta + counts из months)
 * @route   GET /api/sku-slices/day-status?konkName=&date=
 */
export const getSkuSliceDayStatusController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const parseResult = getSkuSliceDayStatusSchema.safeParse(req.query);
  if (!parseResult.success) {
    res.status(400).json({
      message: "Validation error",
      errors: parseResult.error.errors,
    });
    return;
  }

  const data = await getSkuSliceDayStatusUtil(parseResult.data);
  res.status(200).json({
    message: "Sku slice day status retrieved successfully",
    data,
  });
};

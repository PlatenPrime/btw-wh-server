import { Request, Response } from "express";
import { getSkuSliceRangeSchema } from "./schemas/getSkuSliceRangeSchema.js";
import { getSkuSliceRangeUtil } from "./utils/getSkuSliceRangeUtil.js";

/**
 * @desc    Срез по SKU за период дат
 * @route   GET /api/sku-slices/sku/:skuId/range?dateFrom=&dateTo=
 */
export const getSkuSliceRangeController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const parseResult = getSkuSliceRangeSchema.safeParse({
    skuId: req.params.skuId,
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

  const result = await getSkuSliceRangeUtil(parseResult.data);
  if (!result.ok) {
    res.status(404).json({
      message: "Sku not found or sku has no productId",
    });
    return;
  }

  res.status(200).json({
    message: "Sku slice range retrieved successfully",
    data: result.data,
  });
};

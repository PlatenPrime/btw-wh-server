import { Request, Response } from "express";
import { getSkuSalesByDateSchema } from "./schemas/getSkuSalesByDateSchema.js";
import { getSkuSalesByDateUtil } from "./utils/getSkuSalesByDateUtil.js";

/**
 * @desc    Продажи и выручка по SKU на дату
 * @route   GET /api/sku-slices/sku/:skuId/sales-by-date?date=
 */
export const getSkuSalesByDateController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const parseResult = getSkuSalesByDateSchema.safeParse({
    skuId: req.params.skuId,
    date: req.query.date,
  });
  if (!parseResult.success) {
    res.status(400).json({
      message: "Validation error",
      errors: parseResult.error.errors,
    });
    return;
  }

  const result = await getSkuSalesByDateUtil(parseResult.data);
  if (!result) {
    res.status(404).json({
      message:
        "Sku not found, sku has no productId, or no slice data for this date",
    });
    return;
  }

  res.status(200).json({
    message: "Sku sales by date retrieved successfully",
    data: result,
  });
};

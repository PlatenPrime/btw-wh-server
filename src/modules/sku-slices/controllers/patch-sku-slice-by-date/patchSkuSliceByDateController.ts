import { Request, Response } from "express";
import { patchSkuSliceByDateSchema } from "./schemas/patchSkuSliceByDateSchema.js";
import { patchSkuSliceByDateUtil } from "./utils/patchSkuSliceByDateUtil.js";

/**
 * @desc    Ручная запись stock/price SKU в срез на дату
 * @route   PATCH /api/sku-slices/sku/:skuId
 */
export const patchSkuSliceByDateController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const parseResult = patchSkuSliceByDateSchema.safeParse({
    skuId: req.params.skuId,
    date: req.body?.date,
    stock: req.body?.stock,
    price: req.body?.price,
  });
  if (!parseResult.success) {
    res.status(400).json({
      message: "Validation error",
      errors: parseResult.error.errors,
    });
    return;
  }

  const result = await patchSkuSliceByDateUtil(parseResult.data);
  if (!result) {
    res.status(404).json({
      message:
        "Sku not found, sku has no productId, or no slice document for this date",
    });
    return;
  }

  res.status(200).json({
    message: "Sku slice by date updated successfully",
    data: result,
  });
};

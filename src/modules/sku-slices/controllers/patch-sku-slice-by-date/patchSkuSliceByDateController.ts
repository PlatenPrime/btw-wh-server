import { Request, Response } from "express";
import {
  isPatchSkuSliceRangeInput,
  patchSkuSliceByDateSchema,
} from "./schemas/patchSkuSliceByDateSchema.js";
import { patchSkuSliceByDateRangeUtil } from "./utils/patchSkuSliceByDateRangeUtil.js";
import { patchSkuSliceByDateUtil } from "./utils/patchSkuSliceByDateUtil.js";

/**
 * @desc    Ручная запись stock/price SKU в срез на дату или диапазон дат
 * @route   PATCH /api/sku-slices/sku/:skuId
 */
export const patchSkuSliceByDateController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const body = req.body ?? {};
  const payload: Record<string, unknown> = {
    skuId: req.params.skuId,
    stock: body.stock,
    price: body.price,
  };
  if (body.date !== undefined) payload.date = body.date;
  if (body.dateFrom !== undefined) payload.dateFrom = body.dateFrom;
  if (body.dateTo !== undefined) payload.dateTo = body.dateTo;

  const parseResult = patchSkuSliceByDateSchema.safeParse(payload);
  if (!parseResult.success) {
    res.status(400).json({
      message: "Validation error",
      errors: parseResult.error.errors,
    });
    return;
  }

  if (isPatchSkuSliceRangeInput(parseResult.data)) {
    const result = await patchSkuSliceByDateRangeUtil(parseResult.data);
    if (!result) {
      res.status(404).json({
        message: "Sku not found or sku has no productId",
      });
      return;
    }

    res.status(200).json({
      message: "Sku slice by date range updated successfully",
      data: result,
    });
    return;
  }

  const result = await patchSkuSliceByDateUtil(parseResult.data);
  if (!result) {
    res.status(404).json({
      message: "Sku not found or sku has no productId",
    });
    return;
  }

  res.status(200).json({
    message: "Sku slice by date updated successfully",
    data: result,
  });
};

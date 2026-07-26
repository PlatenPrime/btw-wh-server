import { Request, Response } from "express";
import { putAirClientSkuSliceSchema } from "./schemas/putAirClientSkuSliceSchema.js";
import { putAirClientSkuSliceUtil } from "./utils/putAirClientSkuSliceUtil.js";

/**
 * @desc    Дозаполнение сегодняшнего Air SkuSlice из HTML first-party страницы
 * @route   PUT /api/sku-slices/client/air/sku/:skuId
 */
export const putAirClientSkuSliceController = async (
  req: Request,
  res: Response
): Promise<void> => {
  const parseResult = putAirClientSkuSliceSchema.safeParse({
    skuId: req.params.skuId,
    sourceUrl: req.body?.sourceUrl,
    html: req.body?.html,
  });
  if (!parseResult.success) {
    res.status(400).json({
      message: "Validation error",
      errors: parseResult.error.errors,
    });
    return;
  }

  const result = await putAirClientSkuSliceUtil(parseResult.data);

  if (!result.ok) {
    if (result.code === "SKU_NOT_FOUND") {
      res.status(404).json({ message: result.message });
      return;
    }
    if (result.code === "PARSE_FAILED") {
      res.status(422).json({ message: result.message });
      return;
    }
    res.status(400).json({ message: result.message, code: result.code });
    return;
  }

  res.status(200).json({
    message:
      result.status === "saved"
        ? "Air client sku slice saved successfully"
        : "Air client sku slice already valid, skipped",
    data: {
      status: result.status,
      date: result.date,
      productId: result.productId,
      stock: result.stock,
      price: result.price,
    },
  });
};

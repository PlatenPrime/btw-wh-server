import { Request, Response } from "express";
import { discoverStockBandSchema } from "./schemas/discoverStockBandSchema.js";
import { discoverStockBandUtil } from "./utils/discoverStockBandUtil.js";

/**
 * @desc    Discover band-spike кандидатов по сохранённому диапазону
 * @route   POST /api/sku-slices/stock-bands/:bandId/discover
 */
export const discoverStockBandController = async (req: Request, res: Response): Promise<void> => {
  const parseResult = discoverStockBandSchema.safeParse({
    bandId: req.params.bandId,
    ...(req.body ?? {}),
  });

  if (!parseResult.success) {
    res.status(400).json({
      message: "Validation error",
      errors: parseResult.error.issues,
    });
    return;
  }

  const result = await discoverStockBandUtil(parseResult.data);
  if (!result.ok) {
    res.status(404).json({ message: result.message });
    return;
  }

  const { ok: _ok, ...data } = result;
  res.status(200).json({
    message: "Stock band spike candidates discovered successfully",
    data,
  });
};

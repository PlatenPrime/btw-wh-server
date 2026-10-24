import { Request, Response } from "express";
import { discoverBandSpikeSchema } from "./schemas/discoverBandSpikeSchema.js";
import { discoverBandSpikeUtil } from "./utils/discoverBandSpikeUtil.js";

/**
 * @desc    Список SKU конкурента с in-band остатком, вышедшим из [stockMin, stockMax] в окне дат
 * @route   POST /api/sku-slices/band-spike/discover
 */
export const discoverBandSpikeController = async (req: Request, res: Response): Promise<void> => {
  const parseResult = discoverBandSpikeSchema.safeParse(req.body ?? {});

  if (!parseResult.success) {
    res.status(400).json({
      message: "Validation error",
      errors: parseResult.error.issues,
    });
    return;
  }

  const data = await discoverBandSpikeUtil(parseResult.data);
  res.status(200).json({
    message: "Band spike candidates discovered successfully",
    data,
  });
};

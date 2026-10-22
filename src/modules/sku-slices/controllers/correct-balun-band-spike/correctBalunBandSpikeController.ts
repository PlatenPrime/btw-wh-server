import { Request, Response } from "express";
import { correctBalunBandSpikeSchema } from "./schemas/correctBalunBandSpikeSchema.js";
import { correctBalunBandSpikeUtil } from "./utils/correctBalunBandSpikeUtil.js";

/**
 * @desc    Клиентский RTL-corrector balun band-spike (preview/apply)
 * @route   POST /api/sku-slices/sku/:skuId/correct-balun-band-spike
 */
export const correctBalunBandSpikeController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const body = req.body ?? {};
  const parseResult = correctBalunBandSpikeSchema.safeParse({
    skuId: req.params.skuId,
    dateFrom: body.dateFrom,
    dateTo: body.dateTo,
    apply: body.apply,
  });

  if (!parseResult.success) {
    res.status(400).json({
      message: "Validation error",
      errors: parseResult.error.issues,
    });
    return;
  }

  const result = await correctBalunBandSpikeUtil(parseResult.data);

  if (!result.ok) {
    if (result.code === "NOT_BALUN") {
      res.status(400).json({ message: result.message });
      return;
    }
    res.status(404).json({ message: result.message });
    return;
  }

  const message = result.applied
    ? "Balun band spike corrected successfully"
    : parseResult.data.apply
      ? "No balun band spike patches to apply"
      : "Balun band spike correction preview";

  res.status(200).json({
    message,
    data: {
      productId: result.productId,
      window: result.window,
      band: result.band,
      patches: result.patches,
      skipped: result.skipped,
      applied: result.applied,
    },
  });
};

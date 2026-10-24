import { Request, Response } from "express";
import { correctBandSpikeSchema } from "./schemas/correctBandSpikeSchema.js";
import { correctBandSpikeUtil } from "./utils/correctBandSpikeUtil.js";

/**
 * @desc    Клиентский RTL-corrector band-spike для любого конкурента (preview/apply)
 * @route   POST /api/sku-slices/sku/:skuId/correct-band-spike
 */
export const correctBandSpikeController = async (req: Request, res: Response): Promise<void> => {
  const body = req.body ?? {};
  const parseResult = correctBandSpikeSchema.safeParse({
    skuId: req.params.skuId,
    dateFrom: body.dateFrom,
    dateTo: body.dateTo,
    stockMin: body.stockMin,
    stockMax: body.stockMax,
    apply: body.apply,
  });

  if (!parseResult.success) {
    res.status(400).json({
      message: "Validation error",
      errors: parseResult.error.issues,
    });
    return;
  }

  const result = await correctBandSpikeUtil(parseResult.data);

  if (!result.ok) {
    res.status(404).json({ message: result.message });
    return;
  }

  const message = result.applied
    ? "Band spike corrected successfully"
    : parseResult.data.apply
      ? "No band spike patches to apply"
      : "Band spike correction preview";

  res.status(200).json({
    message,
    data: {
      konkName: result.konkName,
      productId: result.productId,
      window: result.window,
      band: result.band,
      patches: result.patches,
      skipped: result.skipped,
      applied: result.applied,
    },
  });
};

import type { Request, Response } from "express";
import { getSelectionSkusPieDataSchema } from "./schemas/getSelectionSkusPieDataSchema.js";
import { getSelectionSkusPieDataUtil } from "./utils/getSelectionSkusPieDataUtil.js";

/**
 * @desc    Pie по произвольному набору SKU: продажи шт/грн и доли в `data`; итог «Всі обрані» в `all`
 * @route   POST /api/sku-chart-reports/selection/skus-pie
 */
export const getSelectionSkusPieDataController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const parseResult = getSelectionSkusPieDataSchema.safeParse(req.body);

  if (!parseResult.success) {
    res.status(400).json({
      message: "Validation error",
      errors: parseResult.error.issues,
    });
    return;
  }

  const result = await getSelectionSkusPieDataUtil(parseResult.data);
  if (!result.ok) {
    res.status(404).json({
      message: "No skus found for provided skuIds",
    });
    return;
  }

  res.status(200).json({
    message: "Selection skus pie data retrieved successfully",
    data: result.data,
    all: result.all,
  });
};

import { Request, Response } from "express";
import { getSkugrSliceExcelSchema } from "./schemas/getSkugrSliceExcelSchema.js";
import { getSkugrSliceExcelUtil } from "./utils/getSkugrSliceExcelUtil.js";

/**
 * @desc    Excel остатков по товарной группе (skugr.skus) за период
 * @route   GET /api/sku-slices/skugr/:skugrId/slice-excel?dateFrom=&dateTo=
 */
export const getSkugrSliceExcelController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const parseResult = getSkugrSliceExcelSchema.safeParse({
    skugrId: req.params.skugrId,
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

  const result = await getSkugrSliceExcelUtil(parseResult.data);
  if (!result.ok) {
    res.status(404).json({
      message:
        "Skugr not found or group has no skus with productId for reporting",
    });
    return;
  }

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${result.fileName}"`,
  );
  res.status(200).send(result.buffer);
};

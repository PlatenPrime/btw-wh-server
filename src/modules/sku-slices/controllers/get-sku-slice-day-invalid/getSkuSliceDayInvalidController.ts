import { Request, Response } from "express";
import { getSkuSliceDayInvalidSchema } from "./schemas/getSkuSliceDayInvalidSchema.js";
import { getSkuSliceDayInvalidUtil } from "./utils/getSkuSliceDayInvalidUtil.js";

/**
 * @desc    Invalid точки дневного среза (пагинация из months)
 * @route   GET /api/sku-slices/day-invalid?konkName=&date=&page=&limit=
 */
export const getSkuSliceDayInvalidController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const parseResult = getSkuSliceDayInvalidSchema.safeParse(req.query);
  if (!parseResult.success) {
    res.status(400).json({
      message: "Validation error",
      errors: parseResult.error.errors,
    });
    return;
  }

  const result = await getSkuSliceDayInvalidUtil(parseResult.data);
  const { items, pagination, konkName, date } = result;

  res.status(200).json({
    message: "Sku slice day invalid points retrieved successfully",
    data: { konkName, date, items },
    pagination,
  });
};

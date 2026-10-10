import { Request, Response } from "express";

/**
 * @desc    Legacy дамп дневного Mixed — снят. Используй day-status / day-invalid.
 * @route   GET /api/sku-slices
 */
export const getSkuSliceController = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  res.status(410).json({
    message:
      "GET /api/sku-slices removed. Use GET /api/sku-slices/day-status and GET /api/sku-slices/day-invalid",
    errors: [
      {
        code: "SKU_SLICE_DAY_LIST_GONE",
        dayStatus: "/api/sku-slices/day-status?konkName=&date=",
        dayInvalid: "/api/sku-slices/day-invalid?konkName=&date=&page=&limit=",
      },
    ],
  });
};

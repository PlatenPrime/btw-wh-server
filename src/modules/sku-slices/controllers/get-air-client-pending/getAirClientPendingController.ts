import { Request, Response } from "express";
import { getAirClientPendingUtil } from "./utils/getAirClientPendingUtil.js";

/**
 * @desc    Очередь Air SKU без валидного среза на сегодня (Kyiv)
 * @route   GET /api/sku-slices/client/air/pending
 */
export const getAirClientPendingController = async (
  _req: Request,
  res: Response
): Promise<void> => {
  const result = await getAirClientPendingUtil();

  res.status(200).json({
    message: "Air client pending retrieved successfully",
    data: {
      date: result.date,
      items: result.items,
      rotation: result.rotation,
    },
  });
};

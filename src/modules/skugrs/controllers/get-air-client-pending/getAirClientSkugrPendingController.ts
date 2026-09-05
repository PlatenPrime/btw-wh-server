import { Request, Response } from "express";
import { getAirClientSkugrPendingUtil } from "./utils/getAirClientSkugrPendingUtil.js";

/**
 * @desc    Очередь Air товарных групп для клиентского refill
 * @route   GET /api/skugrs/client/air/pending
 */
export const getAirClientSkugrPendingController = async (
  _req: Request,
  res: Response
): Promise<void> => {
  const result = await getAirClientSkugrPendingUtil();

  res.status(200).json({
    message: "Air client skugr pending retrieved successfully",
    data: {
      items: result.items,
    },
  });
};

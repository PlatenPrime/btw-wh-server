import { Request, Response } from "express";
import { logModuleError } from "../../../../logging/logModuleError.js";
import { toSkuStockBandDto } from "../../utils/toSkuStockBandDto.js";
import { listSkuStockBandsSchema } from "./schemas/listSkuStockBandsSchema.js";
import { listSkuStockBandsUtil } from "./utils/listSkuStockBandsUtil.js";

/**
 * @desc    Список диапазонов остатков
 * @route   GET /api/sku-stock-bands
 */
export const listSkuStockBandsController = async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = listSkuStockBandsSchema.safeParse(req.query ?? {});
    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.issues,
      });
      return;
    }

    const list = await listSkuStockBandsUtil(parseResult.data);
    res.status(200).json({
      message: "Sku stock bands retrieved successfully",
      data: list.map(toSkuStockBandDto),
    });
  } catch (error) {
    logModuleError("sku-stock-bands", error, "Error listing sku stock bands:");
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
};

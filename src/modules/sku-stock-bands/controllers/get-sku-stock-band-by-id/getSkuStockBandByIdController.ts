import { Request, Response } from "express";
import { logModuleError } from "../../../../logging/logModuleError.js";
import { toSkuStockBandDto } from "../../utils/toSkuStockBandDto.js";
import { getSkuStockBandByIdSchema } from "./schemas/getSkuStockBandByIdSchema.js";
import { getSkuStockBandByIdUtil } from "./utils/getSkuStockBandByIdUtil.js";

/**
 * @desc    Получить диапазон по id
 * @route   GET /api/sku-stock-bands/:id
 */
export const getSkuStockBandByIdController = async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = getSkuStockBandByIdSchema.safeParse({ id: req.params.id });
    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.issues,
      });
      return;
    }

    const band = await getSkuStockBandByIdUtil(parseResult.data.id);
    if (!band) {
      res.status(404).json({ message: "Sku stock band not found" });
      return;
    }

    res.status(200).json({
      message: "Sku stock band retrieved successfully",
      data: toSkuStockBandDto(band),
    });
  } catch (error) {
    logModuleError("sku-stock-bands", error, "Error getting sku stock band:");
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
};

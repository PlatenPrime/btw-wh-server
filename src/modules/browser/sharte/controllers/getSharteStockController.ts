import { Request, Response } from "express";
import { getSharteStockSchema } from "../utils/getSharteStockSchema.js";
import { getSharteStockData } from "../utils/getSharteStockData.js";

/**
 * @desc    Получить остатки товара с sharte.net по URL страницы товара
 * @route   GET /api/browser/sharte/stock?url=...
 */
export const getSharteStockController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const url = typeof req.query?.url === "string" ? req.query.url : undefined;
    const parseResult = getSharteStockSchema.safeParse({ url });
    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
      return;
    }

    const stockInfo = await getSharteStockData(parseResult.data.url);
    if (stockInfo.stock === -1 && stockInfo.price === -1) {
      res.status(404).json({
        message: "Товар не найден или данные скрыты",
      });
      return;
    }

    res.status(200).json({
      message: "Sharte stock retrieved successfully",
      data: stockInfo,
    });
  } catch (error) {
    console.error("Error fetching Sharte stock by url:", error);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
};

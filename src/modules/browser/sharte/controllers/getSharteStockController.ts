import { Request, Response } from "express";
import { getSharteStockSchema } from "../utils/getSharteStockSchema.js";
import { getSharteStockData } from "../utils/getSharteStockData.js";

/**
 * @desc    Получить остатки товара с sharte.net по id
 * @route   GET /api/browser/sharte/stock/:id
 */
export const getSharteStockController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const url = typeof req.query?.url === "string" ? req.query.url : undefined;
    const parseResult = getSharteStockSchema.safeParse({ id, url });
    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
      return;
    }

    const productUrl = parseResult.data.url?.trim() ?? "";
    const stockInfo = await getSharteStockData(parseResult.data.id, productUrl);
    if (!stockInfo) {
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
    console.error("Error fetching Sharte stock by id:", error);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
};

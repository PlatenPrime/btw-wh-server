import { Request, Response } from "express";
import { getAirStockSchema } from "../utils/getAirStockSchema.js";
import { getAirStockData } from "../utils/getAirStockData.js";

/**
 * @desc    Получить остатки и цену товара с сайта air по ссылке на страницу товара
 * @route   GET /api/browser/air/stock?link=<url>
 */
export const getAirStockController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const link = req.query.link;
    const parseResult = getAirStockSchema.safeParse({ link });
    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
      return;
    }

    const data = await getAirStockData(parseResult.data.link);
    if (!data) {
      res.status(404).json({
        message: "Товар не найден или данные недоступны",
      });
      return;
    }

    res.status(200).json({
      message: "Air stock retrieved successfully",
      data,
    });
  } catch (error) {
    console.error("Error fetching Air stock by link:", error);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
};

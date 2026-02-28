import { Request, Response } from "express";
import { getBalunStockSchema } from "../utils/getBalunStockSchema.js";
import { getBalunStockData } from "../utils/getBalunStockData.js";

/**
 * @desc    Получить остатки и цену товара с сайта Balun по ссылке на страницу товара
 * @route   GET /api/browser/balun/stock?link=<url>
 */
export const getBalunStockController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const link = req.query.link;
    const parseResult = getBalunStockSchema.safeParse({ link });
    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
      return;
    }

    const data = await getBalunStockData(parseResult.data.link);
    if (data.stock === -1 && data.price === -1) {
      res.status(404).json({
        message: "Товар не найден или данные недоступны",
      });
      return;
    }

    res.status(200).json({
      message: "Balun stock retrieved successfully",
      data,
    });
  } catch (error) {
    console.error("Error fetching Balun stock by link:", error);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
};

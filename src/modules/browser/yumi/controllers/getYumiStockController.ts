import { Request, Response } from "express";
import { getYumiStockSchema } from "../utils/getYumiStockSchema.js";
import { getYumiStockData } from "../utils/getYumiStockData.js";

/**
 * @desc    Получить остатки и цену товара с сайта Yumi по ссылке на страницу товара
 * @route   GET /api/browser/yumi/stock?link=<url>
 */
export const getYumiStockController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const link = req.query.link;
    const parseResult = getYumiStockSchema.safeParse({ link });

    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
      return;
    }

    const data = await getYumiStockData(parseResult.data.link);
    if (!data) {
      res.status(404).json({
        message: "Товар не найден или данные недоступны",
      });
      return;
    }

    res.status(200).json({
      message: "Yumi stock retrieved successfully",
      data,
    });
  } catch (error) {
    console.error("Error fetching Yumi stock by link:", error);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
};


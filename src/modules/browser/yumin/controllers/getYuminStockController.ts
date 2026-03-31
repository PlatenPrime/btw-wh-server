import { Request, Response } from "express";
import { getYuminStockSchema } from "../utils/getYuminStockSchema.js";
import { getYuminStockData } from "../utils/getYuminStockData.js";
import { logBrowserError } from "../../utils/browserRequest.js";

/**
 * @desc    Получить остатки и цену товара с сайта Yumin по ссылке на страницу товара
 * @route   GET /api/browser/yumin/stock?link=<url>
 */
export const getYuminStockController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const link = req.query.link;
    const parseResult = getYuminStockSchema.safeParse({ link });

    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
      return;
    }

    const data = await getYuminStockData(parseResult.data.link);
    if (data.stock === -1 && data.price === -1) {
      res.status(404).json({
        message: "Товар не найден или данные недоступны",
      });
      return;
    }

    res.status(200).json({
      message: "Yumin stock retrieved successfully",
      data,
    });
  } catch (error) {
    logBrowserError("Error fetching Yumin stock by link:", error);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
};

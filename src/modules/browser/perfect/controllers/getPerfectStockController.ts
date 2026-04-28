import { Request, Response } from "express";
import { logBrowserError } from "../../utils/browserRequest.js";
import { getPerfectStockData } from "../utils/getPerfectStockData.js";
import { getPerfectStockSchema } from "../utils/getPerfectStockSchema.js";

/**
 * @desc    Получить остатки и цену товара с сайта Perfect по ссылке на страницу товара
 * @route   GET /api/browser/perfect/stock?link=<url>
 */
export const getPerfectStockController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const link = req.query.link;
    const parseResult = getPerfectStockSchema.safeParse({ link });
    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
      return;
    }

    const data = await getPerfectStockData(parseResult.data.link);
    if (data.stock === -1 && data.price === -1) {
      res.status(404).json({
        message: "Товар не найден или данные недоступны",
      });
      return;
    }

    res.status(200).json({
      message: "Perfect stock retrieved successfully",
      data,
    });
  } catch (error) {
    logBrowserError("Error fetching Perfect stock by link:", error);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
};

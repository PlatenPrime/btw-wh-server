import { Request, Response } from "express";
import { getDojdevikStockSchema } from "../utils/getDojdevikStockSchema.js";
import { getDojdevikStockData } from "../utils/getDojdevikStockData.js";
import { logBrowserError } from "../../utils/browserRequest.js";

/**
 * @desc    Получить остатки и цену товара с сайта dojdevik по ссылке на страницу товара
 * @route   GET /api/browser/dojdevik/stock?link=<url>
 */
export const getDojdevikStockController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const link = req.query.link;
    const parseResult = getDojdevikStockSchema.safeParse({ link });
    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
      return;
    }

    const data = await getDojdevikStockData(parseResult.data.link);
    if (data.stock === -1 && data.price === -1) {
      res.status(404).json({
        message: "Товар не найден или данные недоступны",
      });
      return;
    }

    res.status(200).json({
      message: "Dojdevik stock retrieved successfully",
      data,
    });
  } catch (error) {
    logBrowserError("Error fetching Dojdevik stock by link:", error);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
};

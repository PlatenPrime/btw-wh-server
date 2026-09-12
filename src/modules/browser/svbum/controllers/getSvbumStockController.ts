import { Request, Response } from "express";
import { getSvbumStockSchema } from "../utils/getSvbumStockSchema.js";
import { getSvbumStockData } from "../utils/getSvbumStockData.js";
import { logBrowserError } from "../../utils/browserRequest.js";

/**
 * @desc    Получить остатки и цену товара с сайта СвятоБум по ссылке на страницу товара
 * @route   GET /api/browser/svbum/stock?link=<url>
 */
export const getSvbumStockController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const link = req.query.link;
    const parseResult = getSvbumStockSchema.safeParse({ link });

    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
      return;
    }

    const data = await getSvbumStockData(parseResult.data.link);
    if (data.stock === -1 && data.price === -1) {
      res.status(404).json({
        message: "Товар не найден или данные недоступны",
      });
      return;
    }

    res.status(200).json({
      message: "Svbum stock retrieved successfully",
      data,
    });
  } catch (error) {
    logBrowserError("Error fetching Svbum stock by link:", error);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
};

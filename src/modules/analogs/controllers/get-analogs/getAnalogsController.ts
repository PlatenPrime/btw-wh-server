import { Request, Response } from "express";
import { getAnalogsQuerySchema } from "./schemas/getAnalogsQuerySchema.js";
import { getAnalogsUtil } from "./utils/getAnalogsUtil.js";

/**
 * @desc    Получить аналоги с пагинацией и фильтрами
 * @route   GET /api/analogs
 */
export const getAnalogsController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const parseResult = getAnalogsQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      res.status(400).json({
        message: "Invalid query parameters",
        errors: parseResult.error.errors,
      });
      return;
    }

    const result = await getAnalogsUtil(parseResult.data);

    res.status(200).json({
      message: "Analogs retrieved successfully",
      data: result.analogs,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Error fetching analogs:", error);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
};

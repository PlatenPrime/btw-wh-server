import { Request, Response } from "express";
import { getVariantsQuerySchema } from "./schemas/getVariantsQuerySchema.js";
import { getVariantsUtil } from "./utils/getVariantsUtil.js";

/**
 * @desc    Получить варианты с пагинацией и фильтрами
 * @route   GET /api/variants
 */
export const getVariantsController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const parseResult = getVariantsQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      res.status(400).json({
        message: "Invalid query parameters",
        errors: parseResult.error.errors,
      });
      return;
    }

    const result = await getVariantsUtil(parseResult.data);

    res.status(200).json({
      message: "Variants retrieved successfully",
      data: result.variants,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Error fetching variants:", error);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
};


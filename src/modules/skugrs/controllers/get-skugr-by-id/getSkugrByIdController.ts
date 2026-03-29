import { Request, Response } from "express";
import { getSkugrByIdSchema } from "./schemas/getSkugrByIdSchema.js";
import { getSkugrByIdUtil } from "./utils/getSkugrByIdUtil.js";

/**
 * @desc    Получить группу товаров конкурента по id (метаданные без поля skus)
 * @route   GET /api/skugrs/id/:id
 */
export const getSkugrByIdController = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const parseResult = getSkugrByIdSchema.safeParse({ id: req.params.id });
    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
      return;
    }

    const data = await getSkugrByIdUtil(parseResult.data.id);
    if (!data) {
      res.status(404).json({ message: "Skugr not found" });
      return;
    }

    res.status(200).json({
      message: "Skugr retrieved successfully",
      data,
    });
  } catch (error) {
    console.error("Error fetching skugr by id:", error);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
};

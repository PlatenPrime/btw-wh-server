import { Request, Response } from "express";
import { getAnalogsByProdSchema } from "./schemas/getAnalogsByProdSchema.js";
import { getAnalogsByProdUtil } from "./utils/getAnalogsByProdUtil.js";

/**
 * @desc    Получить аналоги по prodName
 * @route   GET /api/analogs/prod/:prodName
 */
export const getAnalogsByProdController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const parseResult = getAnalogsByProdSchema.safeParse({
      ...req.params,
      ...req.query,
    });
    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
      return;
    }

    const result = await getAnalogsByProdUtil(parseResult.data);

    res.status(200).json({
      message: "Analogs retrieved successfully",
      data: result.analogs,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Error fetching analogs by prod:", error);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
};

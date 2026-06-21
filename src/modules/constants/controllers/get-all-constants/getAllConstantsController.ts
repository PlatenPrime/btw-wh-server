import { Request, Response } from "express";
import { getAllConstantsUtil } from "./utils/getAllConstantsUtil.js";
import { logModuleError } from "../../../../logging/logModuleError.js";

/**
 * @desc    Получить все константы
 * @route   GET /api/constants
 */
export const getAllConstantsController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const list = await getAllConstantsUtil();
    res.status(200).json({
      message: "Constants retrieved successfully",
      data: list,
    });
  } catch (error) {
    logModuleError("constants", error, "Error fetching constants:");
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
};

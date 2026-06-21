import { Request, Response } from "express";
import { getAllProdsUtil } from "./utils/getAllProdsUtil.js";
import { logModuleError } from "../../../../logging/logModuleError.js";

/**
 * @desc    Получить всех производителей
 * @route   GET /api/prods
 */
export const getAllProdsController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const list = await getAllProdsUtil();
    res.status(200).json({
      message: "Prods retrieved successfully",
      data: list,
    });
  } catch (error) {
    logModuleError("prods", error, "Error fetching prods:");
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
};

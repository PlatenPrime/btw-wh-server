import { Request, Response } from "express";
import { getAllDelsUtil } from "./utils/getAllDelsUtil.js";

/**
 * @desc    Получить список поставок (без artikuls)
 * @route   GET /api/dels
 */
export const getAllDelsController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const list = await getAllDelsUtil();
    res.status(200).json({
      message: "Dels retrieved successfully",
      data: list,
    });
  } catch (error) {
    console.error("Error fetching dels:", error);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
};

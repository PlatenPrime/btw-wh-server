import { Request, Response } from "express";
import { getAnalogsByArtikulSchema } from "./schemas/getAnalogsByArtikulSchema.js";
import { getAnalogsByArtikulUtil } from "./utils/getAnalogsByArtikulUtil.js";

/**
 * @desc    Получить аналоги по artikul
 * @route   GET /api/analogs/artikul/:artikul
 */
export const getAnalogsByArtikulController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { artikul } = req.params;
    const parseResult = getAnalogsByArtikulSchema.safeParse({ artikul });
    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
      return;
    }

    const analogs = await getAnalogsByArtikulUtil(parseResult.data.artikul);

    res.status(200).json({
      message: "Analogs retrieved successfully",
      data: analogs,
    });
  } catch (error) {
    console.error("Error fetching analogs by artikul:", error);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
};

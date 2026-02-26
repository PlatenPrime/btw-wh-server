import { Request, Response } from "express";
import { getAnalogsByKonkSchema } from "./schemas/getAnalogsByKonkSchema.js";
import { getAnalogsByKonkUtil } from "./utils/getAnalogsByKonkUtil.js";

/**
 * @desc    Получить аналоги по konkName
 * @route   GET /api/analogs/konk/:konkName
 */
export const getAnalogsByKonkController = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { konkName } = req.params;
    const parseResult = getAnalogsByKonkSchema.safeParse({ konkName });
    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
      return;
    }

    const analogs = await getAnalogsByKonkUtil(parseResult.data.konkName);

    res.status(200).json({
      message: "Analogs retrieved successfully",
      data: analogs,
    });
  } catch (error) {
    console.error("Error fetching analogs by konk:", error);
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }
};

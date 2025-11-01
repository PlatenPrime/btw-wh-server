import { Request, Response } from "express";
import { getCalculationStatus } from "../../utils/calculationStatus.js";
import { getCalculationStatusSchema } from "./schemas/getCalculationStatusSchema.js";

/**
 * @desc    Получить текущий статус расчета дефицитов
 * @route   GET /api/defs/calculation-status
 * @access  Private
 */
export const getCalculationStatusController = async (
  req: Request,
  res: Response
) => {
  try {
    // Валидация входных данных
    const parseResult = getCalculationStatusSchema.safeParse({});
    if (!parseResult.success) {
      res.status(400).json({
        message: "Validation error",
        errors: parseResult.error.errors,
      });
      return;
    }

    const status = getCalculationStatus();

    res.status(200).json({
      success: true,
      data: status,
    });
    return;
  } catch (error) {
    console.error("Error in getCalculationStatusController:", error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Failed to get calculation status",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
};


import { Request, Response } from "express";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { getCalculationStatus } from "../utils/calculationStatus.js";

/**
 * @desc    Получить текущий статус расчета дефицитов
 * @route   GET /api/defs/calculation-status
 * @access  Private
 */
export const getCalculationStatusController = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const status = getCalculationStatus();

      res.status(200).json({
        success: true,
        data: status,
      });
    } catch (error) {
      console.error("Error in getCalculationStatusController:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get calculation status",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

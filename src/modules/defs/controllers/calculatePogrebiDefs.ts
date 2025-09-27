import { Request, Response } from "express";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { calculateAndSavePogrebiDefs } from "../utils/calculatePogrebiDefs.js";
import {
  finishCalculationTracking,
  resetCalculationStatus,
} from "../utils/calculationStatus.js";

/**
 * @desc    Выполнить расчет дефицитов и сохранить результат в БД
 * @route   POST /api/defs/calculate
 * @access  Private
 */
export const calculatePogrebiDefsController = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      // Сбрасываем предыдущий статус
      resetCalculationStatus();

      // Выполняем расчет дефицитов и сохраняем в БД
      const savedDefcalc = await calculateAndSavePogrebiDefs();

      // Завершаем отслеживание
      finishCalculationTracking();

      res.status(201).json({
        success: true,
        message: "Deficit calculation completed and saved successfully",
        data: {
          totalItems: savedDefcalc.totalItems,
          totalDeficits: savedDefcalc.totalDeficits,
          createdAt: savedDefcalc.createdAt,
        },
      });
    } catch (error) {
      console.error("Error in calculatePogrebiDefsController:", error);

      // Завершаем отслеживание даже при ошибке
      finishCalculationTracking();

      res.status(500).json({
        success: false,
        message: "Failed to calculate and save deficits",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

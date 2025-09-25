import { Request, Response } from "express";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { Defcalc } from "../models/Defcalc.js";
import { calculatePogrebiDefs } from "../utils/calculatePogrebiDefs.js";

/**
 * @desc    Выполнить расчет дефицитов и сохранить результат в БД
 * @route   POST /api/defs/calculate
 * @access  Private
 */
export const calculatePogrebiDefsController = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      // Выполняем расчет дефицитов
      const result = await calculatePogrebiDefs();

      // Сохраняем результат в базу данных
      const defcalc = new Defcalc({
        result,
      });

      const savedDefcalc = await defcalc.save();

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
      res.status(500).json({
        success: false,
        message: "Failed to calculate and save deficits",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

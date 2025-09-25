import { Request, Response } from "express";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { Defcalc } from "../models/Defcalc.js";

/**
 * @desc    Получить последнюю актуальную запись о дефицитах
 * @route   GET /api/defs/latest
 * @access  Private
 */
export const getLatestDefcalcs = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const latestDefcalc = await Defcalc.findOne()
        .sort({ createdAt: -1 })
        .lean();

      if (!latestDefcalc) {
        return res.status(404).json({
          success: false,
          message: "No deficit calculations found",
        });
      }

      res.json({
        success: true,
        data: latestDefcalc,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to get latest deficit calculation",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

import { Request, Response } from "express";
import { calculatePullsUtil } from "./utils/calculatePullsUtil.js";

/**
 * Controller to get all calculated pulls
 * GET /api/pulls
 *
 * Calculates and returns current pulls based on all "new" asks
 * Groups positions by pallet and sorts by sector for optimal processing
 */
export const getPullsController = async (req: Request, res: Response) => {
  try {
    const pullsResponse = await calculatePullsUtil();

    res.status(200).json({
      success: true,
      message: "Pulls calculated successfully",
      data: pullsResponse,
    });
    return;
  } catch (error) {
    console.error("Error getting pulls:", error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Failed to calculate pulls",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
};

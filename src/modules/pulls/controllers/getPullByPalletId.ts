import { Request, Response } from "express";
import mongoose from "mongoose";
import { calculatePullByPalletId } from "../utils/calculatePulls.js";

/**
 * Controller to get a specific pull by pallet ID
 * GET /api/pulls/:palletId
 *
 * Calculates and returns pull for the specified pallet
 */
export const getPullByPalletId = async (req: Request, res: Response) => {
  try {
    const { palletId } = req.params;

    // Validate palletId format
    if (!mongoose.Types.ObjectId.isValid(palletId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid pallet ID format",
      });
    }

    const palletObjectId = new mongoose.Types.ObjectId(palletId);
    const pull = await calculatePullByPalletId(palletObjectId);

    if (!pull) {
      return res.status(404).json({
        success: false,
        message: "Pull not found for the specified pallet",
        data: null,
      });
    }

    res.status(200).json({
      success: true,
      message: "Pull retrieved successfully",
      data: pull,
    });
  } catch (error) {
    console.error("Error getting pull by pallet ID:", error);
    res.status(500).json({
      success: false,
      message: "Failed to calculate pull for pallet",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

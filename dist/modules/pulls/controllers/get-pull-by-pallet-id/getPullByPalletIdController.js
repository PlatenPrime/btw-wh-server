import mongoose from "mongoose";
import { calculatePullByPalletIdUtil } from "../../utils/calculatePullsUtil.js";
/**
 * Controller to get a specific pull by pallet ID
 * GET /api/pulls/:palletId
 *
 * Calculates and returns pull for the specified pallet
 */
export const getPullByPalletIdController = async (req, res) => {
    try {
        const { palletId } = req.params;
        // Validate palletId format
        if (!mongoose.Types.ObjectId.isValid(palletId)) {
            res.status(400).json({
                success: false,
                message: "Invalid pallet ID format",
            });
            return;
        }
        const palletObjectId = new mongoose.Types.ObjectId(palletId);
        const pull = await calculatePullByPalletIdUtil(palletObjectId);
        if (!pull) {
            res.status(200).json({
                success: true,
                exists: false,
                message: "Pull not found for the specified pallet",
                data: null,
            });
            return;
        }
        res.status(200).json({
            success: true,
            exists: true,
            message: "Pull retrieved successfully",
            data: pull,
        });
        return;
    }
    catch (error) {
        console.error("Error getting pull by pallet ID:", error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: "Failed to calculate pull for pallet",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
};

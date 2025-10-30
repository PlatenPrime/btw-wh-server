import { calculatePulls } from "../../utils/calculatePulls.js";
/**
 * Controller to get all calculated pulls
 * GET /api/pulls
 *
 * Calculates and returns current pulls based on all "new" asks
 * Groups positions by pallet and sorts by sector for optimal processing
 */
export const getPulls = async (req, res) => {
    try {
        const pullsResponse = await calculatePulls();
        res.status(200).json({
            success: true,
            message: "Pulls calculated successfully",
            data: pullsResponse,
        });
    }
    catch (error) {
        console.error("Error getting pulls:", error);
        res.status(500).json({
            success: false,
            message: "Failed to calculate pulls",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

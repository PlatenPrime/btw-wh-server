import { getAllDelsUtil } from "./utils/getAllDelsUtil.js";
import { logModuleError } from "../../../../logging/logModuleError.js";
/**
 * @desc    Получить список поставок (без artikuls)
 * @route   GET /api/dels
 */
export const getAllDelsController = async (req, res) => {
    try {
        const list = await getAllDelsUtil();
        res.status(200).json({
            message: "Dels retrieved successfully",
            data: list,
        });
    }
    catch (error) {
        logModuleError("dels", error, "Error fetching dels:");
        if (!res.headersSent) {
            res.status(500).json({
                message: "Server error",
                error: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
};

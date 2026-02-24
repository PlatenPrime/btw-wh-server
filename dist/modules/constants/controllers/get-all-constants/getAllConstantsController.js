import { getAllConstantsUtil } from "./utils/getAllConstantsUtil.js";
/**
 * @desc    Получить все константы
 * @route   GET /api/constants
 */
export const getAllConstantsController = async (req, res) => {
    try {
        const list = await getAllConstantsUtil();
        res.status(200).json({
            message: "Constants retrieved successfully",
            data: list,
        });
    }
    catch (error) {
        console.error("Error fetching constants:", error);
        if (!res.headersSent) {
            res.status(500).json({
                message: "Server error",
                error: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
};

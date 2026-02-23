import { getAllKonksUtil } from "./utils/getAllKonksUtil.js";
/**
 * @desc    Получить всех конкурентов
 * @route   GET /api/konks
 */
export const getAllKonksController = async (req, res) => {
    try {
        const list = await getAllKonksUtil();
        res.status(200).json({
            message: "Konks retrieved successfully",
            data: list,
        });
    }
    catch (error) {
        console.error("Error fetching konks:", error);
        if (!res.headersSent) {
            res.status(500).json({
                message: "Server error",
                error: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
};

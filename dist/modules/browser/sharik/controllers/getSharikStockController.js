import { getSharikStockSchema } from "../utils/getSharikStockSchema.js";
import { getSharikStockData } from "../utils/getSharikStockData.js";
/**
 * @desc    Получить остатки товара с sharik.ua по артикулу
 * @route   GET /api/browser/sharik/stock/:artikul
 */
export const getSharikStockController = async (req, res) => {
    try {
        const { artikul } = req.params;
        const parseResult = getSharikStockSchema.safeParse({ artikul });
        if (!parseResult.success) {
            res.status(400).json({
                message: "Validation error",
                errors: parseResult.error.errors,
            });
            return;
        }
        const data = await getSharikStockData(parseResult.data.artikul);
        if (!data) {
            res.status(404).json({
                message: "Товар не найден",
            });
            return;
        }
        res.status(200).json({
            message: "Sharik stock retrieved successfully",
            data,
        });
    }
    catch (error) {
        console.error("Error fetching Sharik stock by artikul:", error);
        if (!res.headersSent) {
            res.status(500).json({
                message: "Server error",
                error: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
};

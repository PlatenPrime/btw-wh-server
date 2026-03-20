import { getAllSkusQuerySchema } from "./schemas/getAllSkusQuerySchema.js";
import { getAllSkusUtil } from "./utils/getAllSkusUtil.js";
/**
 * @desc    Получить sku с пагинацией и фильтрами
 * @route   GET /api/skus
 */
export const getAllSkusController = async (req, res) => {
    try {
        const parseResult = getAllSkusQuerySchema.safeParse(req.query);
        if (!parseResult.success) {
            res.status(400).json({
                message: "Invalid query parameters",
                errors: parseResult.error.errors,
            });
            return;
        }
        const result = await getAllSkusUtil(parseResult.data);
        res.status(200).json({
            message: "Skus retrieved successfully",
            data: result.skus,
            pagination: result.pagination,
        });
    }
    catch (error) {
        console.error("Error fetching skus:", error);
        if (!res.headersSent) {
            res.status(500).json({
                message: "Server error",
                error: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
};

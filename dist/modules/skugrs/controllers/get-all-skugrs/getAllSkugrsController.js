import { toSkugrDto } from "../../utils/toSkugrDto.js";
import { getAllSkugrsQuerySchema } from "./schemas/getAllSkugrsQuerySchema.js";
import { getAllSkugrsUtil } from "./utils/getAllSkugrsUtil.js";
/**
 * @desc    Получить группы товаров конкурента с фильтрами и пагинацией
 * @route   GET /api/skugrs
 */
export const getAllSkugrsController = async (req, res) => {
    try {
        const parseResult = getAllSkugrsQuerySchema.safeParse(req.query);
        if (!parseResult.success) {
            res.status(400).json({
                message: "Invalid query parameters",
                errors: parseResult.error.errors,
            });
            return;
        }
        const result = await getAllSkugrsUtil(parseResult.data);
        res.status(200).json({
            message: "Skugrs retrieved successfully",
            data: result.skugrs.map(toSkugrDto),
            pagination: result.pagination,
        });
    }
    catch (error) {
        console.error("Error fetching skugrs:", error);
        if (!res.headersSent) {
            res.status(500).json({
                message: "Server error",
                error: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
};

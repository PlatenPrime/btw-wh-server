import { getAllArtsQuerySchema } from "./schemas/getAllArtsSchema.js";
import { getAllArtsUtil } from "./utils/getAllArtsUtil.js";
export const getAllArtsController = async (req, res) => {
    try {
        // Валидация параметров запроса
        const parseResult = getAllArtsQuerySchema.safeParse(req.query);
        if (!parseResult.success) {
            res.status(400).json({
                message: "Invalid query parameters",
                errors: parseResult.error.errors,
            });
            return;
        }
        const { page, limit, search } = parseResult.data;
        const result = await getAllArtsUtil({
            page,
            limit,
            search,
        });
        res.status(200).json({
            data: result.arts,
            total: result.pagination.total,
            page: result.pagination.page,
            totalPages: result.pagination.totalPages,
        });
    }
    catch (error) {
        console.error("Error fetching arts:", error);
        if (!res.headersSent) {
            res.status(500).json({
                message: "Server error",
                error: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
};

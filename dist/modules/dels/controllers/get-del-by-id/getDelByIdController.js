import { getDelByIdSchema } from "./schemas/getDelByIdSchema.js";
import { getDelByIdUtil } from "./utils/getDelByIdUtil.js";
/**
 * @desc    Получить поставку по id (полный документ)
 * @route   GET /api/dels/id/:id
 */
export const getDelByIdController = async (req, res) => {
    try {
        const { id } = req.params;
        const parseResult = getDelByIdSchema.safeParse({ id });
        if (!parseResult.success) {
            res.status(400).json({
                message: "Validation error",
                errors: parseResult.error.errors,
            });
            return;
        }
        const del = await getDelByIdUtil(parseResult.data.id);
        if (!del) {
            res.status(404).json({ message: "Del not found" });
            return;
        }
        res.status(200).json({
            message: "Del retrieved successfully",
            data: del,
        });
    }
    catch (error) {
        console.error("Error fetching del by id:", error);
        if (!res.headersSent) {
            res.status(500).json({
                message: "Server error",
                error: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
};

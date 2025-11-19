import { getBlockByIdSchema } from "./schemas/getBlockByIdSchema.js";
import { getBlockByIdUtil } from "./utils/getBlockByIdUtil.js";
export const getBlockById = async (req, res) => {
    try {
        const { id } = req.params;
        // Валидация входных данных
        const parseResult = getBlockByIdSchema.safeParse({ id });
        if (!parseResult.success) {
            res.status(400).json({
                message: "Invalid block ID format",
                errors: parseResult.error.errors,
            });
            return;
        }
        const block = await getBlockByIdUtil({ id: parseResult.data.id });
        if (!block) {
            res.status(404).json({
                message: "Block not found",
                data: null,
            });
            return;
        }
        res.status(200).json({
            message: "Block retrieved successfully",
            data: block,
        });
    }
    catch (error) {
        console.error("Error fetching block by ID:", error);
        if (!res.headersSent) {
            res.status(500).json({
                message: "Server error",
                error: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
};

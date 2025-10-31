import { getAskByIdSchema } from "./schemas/getAskByIdSchema.js";
import { getAskUtil } from "./utils/getAskUtil.js";
export const getAskById = async (req, res) => {
    try {
        const { id } = req.params;
        // Валидация параметров
        const parseResult = getAskByIdSchema.safeParse({ id });
        if (!parseResult.success) {
            res.status(400).json({
                message: "Validation error",
                errors: parseResult.error.errors,
            });
            return;
        }
        const ask = await getAskUtil(parseResult.data.id);
        if (!ask) {
            res.status(200).json({
                exists: false,
                message: "Ask not found",
                data: null,
            });
            return;
        }
        res.status(200).json({
            exists: true,
            message: "Ask retrieved successfully",
            data: ask,
        });
    }
    catch (error) {
        console.error("Error fetching ask by ID:", error);
        res.status(500).json({
            message: "Server error while fetching ask",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

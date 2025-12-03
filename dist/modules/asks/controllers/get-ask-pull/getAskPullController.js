import { getAskPullSchema } from "./schemas/getAskPullSchema.js";
import { getAskPullUtil } from "./utils/getAskPullUtil.js";
export const getAskPullController = async (req, res) => {
    try {
        const { id } = req.params;
        // Валидация параметров
        const parseResult = getAskPullSchema.safeParse({ id });
        if (!parseResult.success) {
            res.status(400).json({
                message: "Validation error",
                errors: parseResult.error.errors,
            });
            return;
        }
        const result = await getAskPullUtil(parseResult.data.id);
        if (!result) {
            res.status(200).json({
                exists: false,
                message: "Ask not found",
                data: null,
            });
            return;
        }
        res.status(200).json({
            exists: true,
            message: "Ask pull positions retrieved successfully",
            data: result,
        });
    }
    catch (error) {
        console.error("Error fetching ask pull positions:", error);
        res.status(500).json({
            message: "Server error while fetching ask pull positions",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

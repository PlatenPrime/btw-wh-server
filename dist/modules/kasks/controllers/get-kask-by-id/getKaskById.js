import { getKaskByIdSchema } from "./schemas/getKaskByIdSchema.js";
import { getKaskUtil } from "./utils/getKaskUtil.js";
export const getKaskById = async (req, res) => {
    try {
        const { id } = req.params;
        const parseResult = getKaskByIdSchema.safeParse({ id });
        if (!parseResult.success) {
            res.status(400).json({
                message: "Validation error",
                errors: parseResult.error.errors,
            });
            return;
        }
        const kask = await getKaskUtil(parseResult.data.id);
        if (!kask) {
            res.status(200).json({
                exists: false,
                message: "Kask not found",
                data: null,
            });
            return;
        }
        res.status(200).json({
            exists: true,
            message: "Kask retrieved successfully",
            data: kask,
        });
    }
    catch (error) {
        console.error("Error fetching kask by ID:", error);
        res.status(500).json({
            message: "Server error while fetching kask",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

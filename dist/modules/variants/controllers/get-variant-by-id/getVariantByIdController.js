import { getVariantByIdSchema } from "./schemas/getVariantByIdSchema.js";
import { getVariantByIdUtil } from "./utils/getVariantByIdUtil.js";
/**
 * @desc    Получить вариант по id
 * @route   GET /api/variants/id/:id
 */
export const getVariantByIdController = async (req, res) => {
    try {
        const { id } = req.params;
        const parseResult = getVariantByIdSchema.safeParse({ id });
        if (!parseResult.success) {
            res.status(400).json({
                message: "Validation error",
                errors: parseResult.error.errors,
            });
            return;
        }
        const result = await getVariantByIdUtil(parseResult.data.id);
        if (!result) {
            res.status(404).json({ message: "Variant not found" });
            return;
        }
        res.status(200).json({
            message: "Variant retrieved successfully",
            data: result,
        });
    }
    catch (error) {
        console.error("Error fetching variant by id:", error);
        if (!res.headersSent) {
            res.status(500).json({
                message: "Server error",
                error: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
};

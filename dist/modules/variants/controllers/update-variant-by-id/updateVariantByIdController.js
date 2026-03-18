import { updateVariantByIdSchema } from "./schemas/updateVariantByIdSchema.js";
import { updateVariantByIdUtil } from "./utils/updateVariantByIdUtil.js";
/**
 * @desc    Обновить вариант по id
 * @route   PATCH /api/variants/id/:id
 */
export const updateVariantByIdController = async (req, res) => {
    try {
        const { id } = req.params;
        const body = req.body;
        const parseResult = updateVariantByIdSchema.safeParse({
            id,
            ...body,
        });
        if (!parseResult.success) {
            res.status(400).json({
                message: "Validation error",
                errors: parseResult.error.errors,
            });
            return;
        }
        const variant = await updateVariantByIdUtil(parseResult.data);
        if (!variant) {
            res.status(404).json({ message: "Variant not found" });
            return;
        }
        res.status(200).json({
            message: "Variant updated successfully",
            data: variant,
        });
    }
    catch (error) {
        console.error("Error updating variant:", error);
        if (!res.headersSent) {
            res.status(500).json({
                message: "Server error",
                error: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
};

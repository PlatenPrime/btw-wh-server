import { deleteVariantByIdSchema } from "./schemas/deleteVariantByIdSchema.js";
import { deleteVariantByIdUtil } from "./utils/deleteVariantByIdUtil.js";
import { logModuleError } from "../../../../logging/logModuleError.js";
import { createEventUtil } from "../../../events/utils/createEventUtil.js";
/**
 * @desc    Удалить вариант по id
 * @route   DELETE /api/variants/id/:id
 */
export const deleteVariantByIdController = async (req, res) => {
    try {
        const { id } = req.params;
        const parseResult = deleteVariantByIdSchema.safeParse({ id });
        if (!parseResult.success) {
            res.status(400).json({
                message: "Validation error",
                errors: parseResult.error.errors,
            });
            return;
        }
        const variant = await deleteVariantByIdUtil(parseResult.data.id);
        if (!variant) {
            res.status(404).json({ message: "Variant not found" });
            return;
        }
        if (req.user?.id) {
            await createEventUtil({
                userId: req.user.id,
                department: "variants",
                description: `Видалено варіант "${variant.title}" (id: ${variant._id})`,
            });
        }
        res.status(200).json({ message: "Variant deleted successfully" });
    }
    catch (error) {
        logModuleError("variants", error, "Error deleting variant:");
        if (!res.headersSent) {
            res.status(500).json({
                message: "Server error",
                error: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
};

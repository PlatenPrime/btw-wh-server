import { deleteDelByIdSchema } from "./schemas/deleteDelByIdSchema.js";
import { deleteDelByIdUtil } from "./utils/deleteDelByIdUtil.js";
import { logModuleError } from "../../../../logging/logModuleError.js";
import { createEventUtil } from "../../../events/utils/createEventUtil.js";
/**
 * @desc    Удалить поставку по id
 * @route   DELETE /api/dels/id/:id
 * @access  PRIME
 */
export const deleteDelByIdController = async (req, res) => {
    try {
        const { id } = req.params;
        const parseResult = deleteDelByIdSchema.safeParse({ id });
        if (!parseResult.success) {
            res.status(400).json({
                message: "Validation error",
                errors: parseResult.error.errors,
            });
            return;
        }
        const del = await deleteDelByIdUtil(parseResult.data.id);
        if (!del) {
            res.status(404).json({ message: "Del not found" });
            return;
        }
        if (req.user?.id) {
            await createEventUtil({
                userId: req.user.id,
                department: "dels",
                type: "delete",
                description: `Видалено поставку "${del.title}" від виробника ${del.prodName} (id: ${parseResult.data.id})`,
            });
        }
        res.status(200).json({
            message: "Del deleted successfully",
        });
    }
    catch (error) {
        logModuleError("dels", error, "Error deleting del:");
        if (!res.headersSent) {
            res.status(500).json({
                message: "Server error",
                error: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
};

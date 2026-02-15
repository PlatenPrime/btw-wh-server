import { deleteDelByIdSchema } from "./schemas/deleteDelByIdSchema.js";
import { deleteDelByIdUtil } from "./utils/deleteDelByIdUtil.js";
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
        res.status(200).json({
            message: "Del deleted successfully",
        });
    }
    catch (error) {
        console.error("Error deleting del:", error);
        if (!res.headersSent) {
            res.status(500).json({
                message: "Server error",
                error: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
};

import { deleteBlockByIdSchema } from "./schemas/deleteBlockByIdSchema.js";
import { deleteBlockByIdUtil } from "./utils/deleteBlockByIdUtil.js";
export const deleteBlock = async (req, res) => {
    try {
        const { id } = req.params;
        // Валидация входных данных
        const parseResult = deleteBlockByIdSchema.safeParse({ id });
        if (!parseResult.success) {
            res.status(400).json({
                message: "Invalid block ID format",
                errors: parseResult.error.errors,
            });
            return;
        }
        const deletedBlock = await deleteBlockByIdUtil({ id: parseResult.data.id });
        if (!deletedBlock) {
            res.status(404).json({
                message: "Block not found",
            });
            return;
        }
        res.status(200).json({
            message: "Block deleted successfully",
            data: deletedBlock,
        });
    }
    catch (error) {
        console.error("Error deleting block:", error);
        if (!res.headersSent) {
            res.status(500).json({
                message: "Server error",
                error: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
};

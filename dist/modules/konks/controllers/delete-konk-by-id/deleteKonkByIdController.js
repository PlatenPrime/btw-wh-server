import { deleteKonkByIdSchema } from "./schemas/deleteKonkByIdSchema.js";
import { deleteKonkByIdUtil } from "./utils/deleteKonkByIdUtil.js";
/**
 * @desc    Удалить конкурента по id
 * @route   DELETE /api/konks/id/:id
 * @access  PRIME
 */
export const deleteKonkByIdController = async (req, res) => {
    try {
        const { id } = req.params;
        const parseResult = deleteKonkByIdSchema.safeParse({ id });
        if (!parseResult.success) {
            res.status(400).json({
                message: "Validation error",
                errors: parseResult.error.errors,
            });
            return;
        }
        const konk = await deleteKonkByIdUtil(parseResult.data.id);
        if (!konk) {
            res.status(404).json({ message: "Konk not found" });
            return;
        }
        res.status(200).json({
            message: "Konk deleted successfully",
        });
    }
    catch (error) {
        console.error("Error deleting konk:", error);
        if (!res.headersSent) {
            res.status(500).json({
                message: "Server error",
                error: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
};

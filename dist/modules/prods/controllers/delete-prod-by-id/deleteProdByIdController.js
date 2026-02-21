import { deleteProdByIdSchema } from "./schemas/deleteProdByIdSchema.js";
import { deleteProdByIdUtil } from "./utils/deleteProdByIdUtil.js";
/**
 * @desc    Удалить производителя по id
 * @route   DELETE /api/prods/id/:id
 * @access  PRIME
 */
export const deleteProdByIdController = async (req, res) => {
    try {
        const { id } = req.params;
        const parseResult = deleteProdByIdSchema.safeParse({ id });
        if (!parseResult.success) {
            res.status(400).json({
                message: "Validation error",
                errors: parseResult.error.errors,
            });
            return;
        }
        const prod = await deleteProdByIdUtil(parseResult.data.id);
        if (!prod) {
            res.status(404).json({ message: "Prod not found" });
            return;
        }
        res.status(200).json({
            message: "Prod deleted successfully",
        });
    }
    catch (error) {
        console.error("Error deleting prod:", error);
        if (!res.headersSent) {
            res.status(500).json({
                message: "Server error",
                error: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
};

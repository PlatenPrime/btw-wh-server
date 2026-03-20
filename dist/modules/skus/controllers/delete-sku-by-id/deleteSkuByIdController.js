import { deleteSkuByIdSchema } from "./schemas/deleteSkuByIdSchema.js";
import { deleteSkuByIdUtil } from "./utils/deleteSkuByIdUtil.js";
/**
 * @desc    Удалить sku по id
 * @route   DELETE /api/skus/id/:id
 * @access  PRIME
 */
export const deleteSkuByIdController = async (req, res) => {
    try {
        const { id } = req.params;
        const parseResult = deleteSkuByIdSchema.safeParse({ id });
        if (!parseResult.success) {
            res.status(400).json({
                message: "Validation error",
                errors: parseResult.error.errors,
            });
            return;
        }
        const sku = await deleteSkuByIdUtil(parseResult.data.id);
        if (!sku) {
            res.status(404).json({ message: "Sku not found" });
            return;
        }
        res.status(200).json({
            message: "Sku deleted successfully",
        });
    }
    catch (error) {
        console.error("Error deleting sku:", error);
        if (!res.headersSent) {
            res.status(500).json({
                message: "Server error",
                error: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
};

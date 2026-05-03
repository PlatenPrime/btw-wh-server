import { deleteSkusNotInAnySkugrQuerySchema } from "./schemas/deleteSkusNotInAnySkugrQuerySchema.js";
import { deleteSkusNotInAnySkugrUtil } from "./utils/deleteSkusNotInAnySkugrUtil.js";
/**
 * @desc    Удалить все Sku, не входящие ни в одну товарную группу (опционально сузить query)
 * @route   DELETE /api/skus/not-in-any-skugr
 */
export const deleteSkusNotInAnySkugrController = async (req, res) => {
    try {
        const parseResult = deleteSkusNotInAnySkugrQuerySchema.safeParse(req.query);
        if (!parseResult.success) {
            res.status(400).json({
                message: "Validation error",
                errors: parseResult.error.errors,
            });
            return;
        }
        const result = await deleteSkusNotInAnySkugrUtil(parseResult.data);
        res.status(200).json({
            message: "Skus not in any skugr deleted successfully",
            deletedCount: result.deletedCount,
        });
    }
    catch (error) {
        console.error("Error deleting skus not in any skugr:", error);
        if (!res.headersSent) {
            res.status(500).json({
                message: "Server error",
                error: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
};

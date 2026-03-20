import { getSkuByIdSchema } from "./schemas/getSkuByIdSchema.js";
import { getSkuByIdUtil } from "./utils/getSkuByIdUtil.js";
/**
 * @desc    Получить sku по id
 * @route   GET /api/skus/id/:id
 */
export const getSkuByIdController = async (req, res) => {
    try {
        const { id } = req.params;
        const parseResult = getSkuByIdSchema.safeParse({ id });
        if (!parseResult.success) {
            res.status(400).json({
                message: "Validation error",
                errors: parseResult.error.errors,
            });
            return;
        }
        const sku = await getSkuByIdUtil(parseResult.data.id);
        if (!sku) {
            res.status(404).json({ message: "Sku not found" });
            return;
        }
        res.status(200).json({
            message: "Sku retrieved successfully",
            data: sku,
        });
    }
    catch (error) {
        console.error("Error fetching sku by id:", error);
        if (!res.headersSent) {
            res.status(500).json({
                message: "Server error",
                error: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
};

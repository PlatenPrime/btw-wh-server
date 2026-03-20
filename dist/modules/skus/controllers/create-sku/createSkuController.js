import { createSkuSchema } from "./schemas/createSkuSchema.js";
import { createSkuUtil } from "./utils/createSkuUtil.js";
/**
 * @desc    Создать sku конкурента
 * @route   POST /api/skus
 */
export const createSkuController = async (req, res) => {
    try {
        const parseResult = createSkuSchema.safeParse(req.body);
        if (!parseResult.success) {
            res.status(400).json({
                message: "Validation error",
                errors: parseResult.error.errors,
            });
            return;
        }
        const sku = await createSkuUtil(parseResult.data);
        res.status(201).json({
            message: "Sku created successfully",
            data: sku,
        });
    }
    catch (error) {
        console.error("Error creating sku:", error);
        if (!res.headersSent) {
            res.status(500).json({
                message: "Server error",
                error: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
};

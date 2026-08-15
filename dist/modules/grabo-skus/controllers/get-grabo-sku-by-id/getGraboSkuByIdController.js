import { logModuleError } from "../../../../logging/logModuleError.js";
import { getGraboSkuByIdSchema } from "./schemas/getGraboSkuByIdSchema.js";
import { getGraboSkuByIdUtil } from "./utils/getGraboSkuByIdUtil.js";
/**
 * @desc    Получить GraboSku по Mongo _id
 * @route   GET /api/grabo-skus/id/:id
 */
export const getGraboSkuByIdController = async (req, res) => {
    try {
        const parseResult = getGraboSkuByIdSchema.safeParse({ id: req.params.id });
        if (!parseResult.success) {
            res.status(400).json({
                message: "Validation error",
                errors: parseResult.error.errors,
            });
            return;
        }
        const graboSku = await getGraboSkuByIdUtil(parseResult.data.id);
        if (!graboSku) {
            res.status(404).json({ message: "Grabo sku not found" });
            return;
        }
        res.status(200).json({
            message: "Grabo sku retrieved successfully",
            data: graboSku,
        });
    }
    catch (error) {
        logModuleError("grabo-skus", error, "Error fetching grabo sku by id:");
        if (!res.headersSent) {
            res.status(500).json({
                message: "Server error",
                error: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
};

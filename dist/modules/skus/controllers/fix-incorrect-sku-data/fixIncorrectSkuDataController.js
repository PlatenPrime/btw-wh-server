import { fixIncorrectSkuDataSchema } from "./schemas/fixIncorrectSkuDataSchema.js";
import { fixIncorrectSkuDataUtil } from "./utils/fixIncorrectSkuDataUtil.js";
/**
 * @desc    Массово исправить поля у SKU, попавших под filter
 * @route   POST /api/skus/fix-incorrect-sku-data
 */
export const fixIncorrectSkuDataController = async (req, res) => {
    try {
        const parseResult = fixIncorrectSkuDataSchema.safeParse(req.body);
        if (!parseResult.success) {
            res.status(400).json({
                message: "Validation error",
                errors: parseResult.error.errors,
            });
            return;
        }
        const result = await fixIncorrectSkuDataUtil(parseResult.data);
        res.status(200).json({
            message: "Sku data fixed successfully",
            data: {
                matchedCount: result.matchedCount,
                modifiedCount: result.modifiedCount,
            },
        });
    }
    catch (error) {
        console.error("Error fixing sku data:", error);
        if (error instanceof Error && error.name === "MongoServerError") {
            const mongoError = error;
            if (mongoError.code === 11000) {
                const duplicateField = mongoError.keyPattern
                    ? Object.keys(mongoError.keyPattern)[0]
                    : "field";
                res.status(409).json({
                    message: `Duplicate value violates unique index on ${duplicateField}`,
                });
                return;
            }
        }
        if (!res.headersSent) {
            res.status(500).json({
                message: "Server error",
                error: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
};

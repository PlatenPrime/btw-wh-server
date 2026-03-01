import { getBtradeSliceQuerySchema } from "./schemas/getBtradeSliceQuerySchema.js";
import { getBtradeSliceUtil } from "./utils/getBtradeSliceUtil.js";
/**
 * @desc    Получить срез Btrade по date
 * @route   GET /api/btrade-slices?date=2025-03-01
 */
export const getBtradeSliceController = async (req, res) => {
    const parseResult = getBtradeSliceQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
        res.status(400).json({
            message: "Validation error",
            errors: parseResult.error.errors,
        });
        return;
    }
    const result = await getBtradeSliceUtil(parseResult.data);
    if (!result) {
        res.status(404).json({ message: "Btrade slice not found" });
        return;
    }
    res.status(200).json({
        message: "Btrade slice retrieved successfully",
        data: result,
    });
};

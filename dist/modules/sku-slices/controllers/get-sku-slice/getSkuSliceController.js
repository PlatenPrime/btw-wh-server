import { getSkuSliceQuerySchema } from "./schemas/getSkuSliceQuerySchema.js";
import { getSkuSliceUtil } from "./utils/getSkuSliceUtil.js";
/**
 * @desc    Срез SKU по конкуренту и дате
 * @route   GET /api/sku-slices?konkName=&date=
 */
export const getSkuSliceController = async (req, res) => {
    const parseResult = getSkuSliceQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
        res.status(400).json({
            message: "Validation error",
            errors: parseResult.error.errors,
        });
        return;
    }
    const result = await getSkuSliceUtil(parseResult.data);
    if (!result) {
        res.status(404).json({ message: "Sku slice not found" });
        return;
    }
    res.status(200).json({
        message: "Sku slice retrieved successfully",
        data: result,
    });
};

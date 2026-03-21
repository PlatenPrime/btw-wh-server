import { getSkuSliceByDateSchema } from "./schemas/getSkuSliceByDateSchema.js";
import { getSkuSliceByDateUtil } from "./utils/getSkuSliceByDateUtil.js";
/**
 * @desc    Срез по SKU на дату (stock, price)
 * @route   GET /api/sku-slices/sku/:skuId?date=
 */
export const getSkuSliceByDateController = async (req, res) => {
    const parseResult = getSkuSliceByDateSchema.safeParse({
        skuId: req.params.skuId,
        date: req.query.date,
    });
    if (!parseResult.success) {
        res.status(400).json({
            message: "Validation error",
            errors: parseResult.error.errors,
        });
        return;
    }
    const result = await getSkuSliceByDateUtil(parseResult.data);
    if (!result) {
        res.status(404).json({
            message: "Sku not found, sku has no productId, or no slice data for this date",
        });
        return;
    }
    res.status(200).json({
        message: "Sku slice by date retrieved successfully",
        data: result,
    });
};

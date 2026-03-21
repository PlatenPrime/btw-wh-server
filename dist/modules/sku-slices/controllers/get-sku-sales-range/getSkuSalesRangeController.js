import { getSkuSalesRangeSchema } from "./schemas/getSkuSalesRangeSchema.js";
import { getSkuSalesRangeUtil } from "./utils/getSkuSalesRangeUtil.js";
/**
 * @desc    Продажи и выручка по SKU за период
 * @route   GET /api/sku-slices/sku/:skuId/sales-range?dateFrom=&dateTo=
 */
export const getSkuSalesRangeController = async (req, res) => {
    const parseResult = getSkuSalesRangeSchema.safeParse({
        skuId: req.params.skuId,
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo,
    });
    if (!parseResult.success) {
        res.status(400).json({
            message: "Validation error",
            errors: parseResult.error.errors,
        });
        return;
    }
    const result = await getSkuSalesRangeUtil(parseResult.data);
    if (!result.ok) {
        res.status(404).json({
            message: "Sku not found or sku has no productId",
        });
        return;
    }
    res.status(200).json({
        message: "Sku sales range retrieved successfully",
        data: result.data,
    });
};

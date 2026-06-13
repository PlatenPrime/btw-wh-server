import { getSkuSliceExcelSchema } from "./schemas/getSkuSliceExcelSchema.js";
import { getSkuSliceExcelUtil } from "./utils/getSkuSliceExcelUtil.js";
/**
 * @desc    Excel остатков по одному SKU за период (метрики: Залишок, Ціна; без Btrade)
 * @route   GET /api/sku-slices/sku/:skuId/slice-excel?dateFrom=&dateTo=
 */
export const getSkuStockSliceExcelController = async (req, res) => {
    const parseResult = getSkuSliceExcelSchema.safeParse({
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
    const result = await getSkuSliceExcelUtil(parseResult.data);
    if (!result.ok) {
        res.status(404).json({
            message: "Sku not found or sku has no productId",
        });
        return;
    }
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${result.fileName}"`);
    res.status(200).send(result.buffer);
};

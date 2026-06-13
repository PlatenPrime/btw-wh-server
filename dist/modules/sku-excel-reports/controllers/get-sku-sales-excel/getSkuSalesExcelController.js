import { getSkuSalesExcelSchema } from "./schemas/getSkuSalesExcelSchema.js";
import { getSkuSalesExcelUtil } from "./utils/getSkuSalesExcelUtil.js";
/**
 * @desc    Excel продаж по одному SKU конкурента за период
 * @route   GET /api/sku-slices/sku/:skuId/sales-excel?dateFrom=&dateTo=
 */
export const getSkuSalesExcelController = async (req, res) => {
    const parseResult = getSkuSalesExcelSchema.safeParse({
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
    const result = await getSkuSalesExcelUtil(parseResult.data);
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

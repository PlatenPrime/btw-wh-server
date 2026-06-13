import { getSkugrSalesExcelSchema } from "./schemas/getSkugrSalesExcelSchema.js";
import { getSkugrSalesExcelUtil } from "./utils/getSkugrSalesExcelUtil.js";
/**
 * @desc    Excel продаж по товарной группе (skugr.skus) за период
 * @route   GET /api/sku-slices/skugr/:skugrId/sales-excel?dateFrom=&dateTo=
 */
export const getSkugrSalesExcelController = async (req, res) => {
    const parseResult = getSkugrSalesExcelSchema.safeParse({
        skugrId: req.params.skugrId,
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
    const result = await getSkugrSalesExcelUtil(parseResult.data);
    if (!result.ok) {
        res.status(404).json({
            message: "Skugr not found or group has no skus with productId for reporting",
        });
        return;
    }
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${result.fileName}"`);
    res.status(200).send(result.buffer);
};

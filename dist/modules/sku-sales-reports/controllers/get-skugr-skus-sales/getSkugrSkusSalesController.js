import { getSkugrSkusSalesSchema } from "./schemas/getSkugrSkusSalesSchema.js";
import { getSkugrSkusSalesUtil } from "./utils/getSkugrSkusSalesUtil.js";
/**
 * @desc    Итоги продаж (шт., грн) по каждому SKU товарной группы Skugr за период
 * @route   GET /api/sku-sales-reports/skugr/:skugrId/skus-sales?dateFrom=&dateTo=
 */
export const getSkugrSkusSalesController = async (req, res) => {
    const parseResult = getSkugrSkusSalesSchema.safeParse({
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
    const result = await getSkugrSkusSalesUtil(parseResult.data);
    if (!result.ok) {
        res.status(404).json({
            message: "Skugr not found",
        });
        return;
    }
    res.status(200).json({
        message: "Skugr skus sales retrieved successfully",
        data: result.data,
        all: result.all,
    });
};

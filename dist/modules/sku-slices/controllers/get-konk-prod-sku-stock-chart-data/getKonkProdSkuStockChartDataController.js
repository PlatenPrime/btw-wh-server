import { getKonkProdSkuStockChartDataSchema } from "./schemas/getKonkProdSkuStockChartDataSchema.js";
import { getKonkProdSkuStockChartDataUtil } from "./utils/getKonkProdSkuStockChartDataUtil.js";
function firstQuery(q, key) {
    const v = q[key];
    return Array.isArray(v) ? v[0] : v;
}
/**
 * @desc    Данные для графика остатков: сумма SKU конкурента vs Btrade по производителю
 * @route   GET /api/sku-slices/konk-prod/stock-chart-data?konk=&prod=&dateFrom=&dateTo= (prod=all — весь konk и все Art по артикулам)
 */
export const getKonkProdSkuStockChartDataController = async (req, res) => {
    const q = req.query;
    const parseResult = getKonkProdSkuStockChartDataSchema.safeParse({
        konk: firstQuery(q, "konk"),
        prod: firstQuery(q, "prod"),
        dateFrom: firstQuery(q, "dateFrom"),
        dateTo: firstQuery(q, "dateTo"),
    });
    if (!parseResult.success) {
        res.status(400).json({
            message: "Validation error",
            errors: parseResult.error.errors,
        });
        return;
    }
    const result = await getKonkProdSkuStockChartDataUtil(parseResult.data);
    if (!result.ok) {
        res.status(404).json({
            message: "No skus found for provided konk/prod, or no sku with productId in group",
        });
        return;
    }
    res.status(200).json({
        message: "Konk/prod SKU stock chart data retrieved successfully",
        data: result.data,
    });
};

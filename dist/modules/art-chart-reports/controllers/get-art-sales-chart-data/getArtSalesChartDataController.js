import { getArtStockChartDataSchema } from "../get-art-stock-chart-data/schemas/getArtStockChartDataSchema.js";
import { getArtSalesChartDataUtil } from "./utils/getArtSalesChartDataUtil.js";
function firstQuery(q, key) {
    const v = q[key];
    return Array.isArray(v) ? v[0] : v;
}
/**
 * @desc    Данные для графика продаж по артикулу
 * @route   GET /api/art-chart-reports/artikul/:artikul/sales?dateFrom=&dateTo=
 */
export const getArtSalesChartDataController = async (req, res) => {
    const parseResult = getArtStockChartDataSchema.safeParse({
        artikul: req.params.artikul,
        dateFrom: firstQuery(req.query, "dateFrom"),
        dateTo: firstQuery(req.query, "dateTo"),
    });
    if (!parseResult.success) {
        res.status(400).json({
            message: "Validation error",
            errors: parseResult.error.errors,
        });
        return;
    }
    const result = await getArtSalesChartDataUtil(parseResult.data);
    if (!result.ok) {
        res.status(404).json({
            message: "Art not found for provided artikul",
        });
        return;
    }
    res.status(200).json({
        message: "Art sales chart data retrieved successfully",
        data: result.data,
    });
};

import { getArtSalesRangeSchema } from "./schemas/getArtSalesRangeSchema.js";
import { getArtSalesRangeUtil } from "./utils/getArtSalesRangeUtil.js";
function firstQuery(q, key) {
    const v = q[key];
    return Array.isArray(v) ? v[0] : v;
}
/**
 * @desc    Продажи и выручка по артикулу за период
 * @route   GET /api/art-sales-reports/artikul/:artikul/range?dateFrom=&dateTo=
 */
export const getArtSalesRangeController = async (req, res) => {
    const parseResult = getArtSalesRangeSchema.safeParse({
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
    const result = await getArtSalesRangeUtil(parseResult.data);
    if (!result.ok) {
        res.status(404).json({
            message: "Art not found for provided artikul",
        });
        return;
    }
    res.status(200).json({
        message: "Art sales range retrieved successfully",
        data: result.data,
    });
};

import { getAnalogSalesRangeSchema } from "./schemas/getAnalogSalesRangeSchema.js";
import { getAnalogSalesRangeUtil } from "./utils/getAnalogSalesRangeUtil.js";
/**
 * @desc    Получить массив продаж и выручки по аналогу за период дат (для графиков)
 * @route   GET /api/analog-slices/analog/:analogId/sales-range?dateFrom=2026-03-01&dateTo=2026-03-31
 */
export const getAnalogSalesRangeController = async (req, res) => {
    const parseResult = getAnalogSalesRangeSchema.safeParse({
        analogId: req.params.analogId,
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
    const result = await getAnalogSalesRangeUtil(parseResult.data);
    if (!result.ok) {
        res.status(404).json({
            message: "Analog not found or analog has no artikul",
        });
        return;
    }
    res.status(200).json({
        message: "Analog sales range retrieved successfully",
        data: result.data,
    });
};

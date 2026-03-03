import { getAnalogSliceRangeSchema } from "./schemas/getAnalogSliceRangeSchema.js";
import { getAnalogSliceRangeUtil } from "./utils/getAnalogSliceRangeUtil.js";
/**
 * @desc    Получить массив данных среза по аналогу за период дат (для графиков)
 * @route   GET /api/analog-slices/analog/:analogId/range?dateFrom=2026-03-01&dateTo=2026-03-31
 */
export const getAnalogSliceRangeController = async (req, res) => {
    const parseResult = getAnalogSliceRangeSchema.safeParse({
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
    const result = await getAnalogSliceRangeUtil(parseResult.data);
    if (!result.ok) {
        res.status(404).json({
            message: "Analog not found or analog has no artikul",
        });
        return;
    }
    res.status(200).json({
        message: "Analog slice range retrieved successfully",
        data: result.data,
    });
};

import { getAnalogSliceByDateSchema } from "./schemas/getAnalogSliceByDateSchema.js";
import { getAnalogSliceByDateUtil } from "./utils/getAnalogSliceByDateUtil.js";
/**
 * @desc    Получить срез по конкретному аналогу на конкретную дату (stock, price)
 * @route   GET /api/analog-slices/analog/:analogId?date=2026-03-01
 */
export const getAnalogSliceByDateController = async (req, res) => {
    const parseResult = getAnalogSliceByDateSchema.safeParse({
        analogId: req.params.analogId,
        date: req.query.date,
    });
    if (!parseResult.success) {
        res.status(400).json({
            message: "Validation error",
            errors: parseResult.error.errors,
        });
        return;
    }
    const result = await getAnalogSliceByDateUtil(parseResult.data);
    if (!result) {
        res.status(404).json({
            message: "Analog not found, analog has no artikul, or no slice data for this date",
        });
        return;
    }
    res.status(200).json({
        message: "Analog slice by date retrieved successfully",
        data: result,
    });
};

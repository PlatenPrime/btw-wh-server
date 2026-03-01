import { getAnalogSliceQuerySchema } from "./schemas/getAnalogSliceQuerySchema.js";
import { getAnalogSliceUtil } from "./utils/getAnalogSliceUtil.js";
/**
 * @desc    Получить срез аналогов по konkName и date
 * @route   GET /api/analog-slices?konkName=air&date=2025-03-01
 */
export const getAnalogSliceController = async (req, res) => {
    const parseResult = getAnalogSliceQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
        res.status(400).json({
            message: "Validation error",
            errors: parseResult.error.errors,
        });
        return;
    }
    const result = await getAnalogSliceUtil(parseResult.data);
    if (!result) {
        res.status(404).json({ message: "Analog slice not found" });
        return;
    }
    res.status(200).json({
        message: "Analog slice retrieved successfully",
        data: result,
    });
};

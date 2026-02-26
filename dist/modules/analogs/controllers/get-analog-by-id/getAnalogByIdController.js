import { getAnalogByIdSchema } from "./schemas/getAnalogByIdSchema.js";
import { getAnalogByIdUtil } from "./utils/getAnalogByIdUtil.js";
/**
 * @desc    Получить аналог по id с полями konk и prod
 * @route   GET /api/analogs/id/:id
 */
export const getAnalogByIdController = async (req, res) => {
    try {
        const { id } = req.params;
        const parseResult = getAnalogByIdSchema.safeParse({ id });
        if (!parseResult.success) {
            res.status(400).json({
                message: "Validation error",
                errors: parseResult.error.errors,
            });
            return;
        }
        const result = await getAnalogByIdUtil(parseResult.data.id);
        if (!result) {
            res.status(404).json({ message: "Analog not found" });
            return;
        }
        res.status(200).json({
            message: "Analog retrieved successfully",
            data: result,
        });
    }
    catch (error) {
        console.error("Error fetching analog by id:", error);
        if (!res.headersSent) {
            res.status(500).json({
                message: "Server error",
                error: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
};

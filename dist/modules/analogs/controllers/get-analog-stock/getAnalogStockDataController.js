import { getAnalogByIdSchema } from "../get-analog-by-id/schemas/getAnalogByIdSchema.js";
import { getAnalogStockDataUtil, UNSUPPORTED_KONK_CODE, } from "./utils/getAnalogStockDataUtil.js";
/**
 * @desc    Получить остаток и цену по аналогу (по id аналога, выбор утилиты по konkName)
 * @route   GET /api/analogs/id/:id/stock
 */
export const getAnalogStockDataController = async (req, res) => {
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
        let data;
        try {
            data = await getAnalogStockDataUtil(parseResult.data.id);
        }
        catch (error) {
            const err = error;
            if (err.code === UNSUPPORTED_KONK_CODE) {
                res.status(400).json({
                    message: "Unsupported competitor for stock",
                });
                return;
            }
            throw error;
        }
        if (data === null) {
            res.status(404).json({ message: "Analog not found" });
            return;
        }
        if (data.stock === -1 && data.price === -1) {
            res.status(404).json({
                message: "Товар не найден или данные недоступны",
            });
            return;
        }
        res.status(200).json({
            message: "Analog stock retrieved successfully",
            data,
        });
    }
    catch (error) {
        console.error("Error fetching analog stock:", error);
        if (!res.headersSent) {
            res.status(500).json({
                message: "Server error",
                error: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
};

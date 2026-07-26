import { logModuleError } from "../../../../logging/logModuleError.js";
import { getSkuStockDataUtil, UNSUPPORTED_KONK_CODE, } from "../../utils/getSkuStockDataUtil.js";
import { getSkuByIdSchema } from "../get-sku-by-id/schemas/getSkuByIdSchema.js";
/**
 * @desc    Получить остаток и цену по SKU (по id, выбор утилиты по konkName)
 * @route   GET /api/skus/id/:id/stock
 */
export const getSkuStockDataController = async (req, res) => {
    try {
        const { id } = req.params;
        const parseResult = getSkuByIdSchema.safeParse({ id });
        if (!parseResult.success) {
            res.status(400).json({
                message: "Validation error",
                errors: parseResult.error.errors,
            });
            return;
        }
        let data;
        try {
            data = await getSkuStockDataUtil(parseResult.data.id);
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
            res.status(404).json({ message: "Sku not found" });
            return;
        }
        if (data.stock === -1 && data.price === -1) {
            res.status(404).json({
                message: "Товар не найден или данные недоступны",
            });
            return;
        }
        res.status(200).json({
            message: "Sku stock retrieved successfully",
            data,
        });
    }
    catch (error) {
        logModuleError("skus", error, "Error fetching sku stock:");
        if (!res.headersSent) {
            res.status(500).json({
                message: "Server error",
                error: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
};

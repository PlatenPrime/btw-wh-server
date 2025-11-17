import { updateAllBtradeStocksUtil } from "../../utils/updateAllBtradeStocksUtil.js";
import { updateAllBtradeStocksSchema } from "./schemas/updateAllBtradeStocksSchema.js";
/**
 * @desc    Обновить btradeStock для всех артикулов
 * @route   POST /api/arts/btrade-stock/update-all
 * @access  Private (ADMIN)
 */
export const updateAllBtradeStocksController = async (req, res) => {
    try {
        // Валидация входных данных (пустая схема, но для консистентности)
        const parseResult = updateAllBtradeStocksSchema.safeParse({});
        if (!parseResult.success) {
            res.status(400).json({
                message: "Validation error",
                errors: parseResult.error.errors,
            });
            return;
        }
        // Запускаем обновление btradeStock для всех артикулов в фоне
        updateAllBtradeStocksUtil().catch((error) => {
            console.error("Error in background updateAllBtradeStocks:", error);
        });
        // Сразу возвращаем ответ клиенту
        res.status(202).json({
            message: "BtradeStock update process started",
        });
    }
    catch (error) {
        console.error("Error starting btradeStock update:", error);
        if (!res.headersSent) {
            res.status(500).json({
                message: "Server error",
                error: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
};

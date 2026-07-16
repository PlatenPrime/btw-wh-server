import { updateAllBtradeStocksUtil } from "../../utils/updateAllBtradeStocksUtil.js";
import { updateAllBtradeStocksSchema } from "./schemas/updateAllBtradeStocksSchema.js";
import { logModuleError } from "../../../../logging/logModuleError.js";
import { createEventUtil } from "../../../events/utils/createEventUtil.js";
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
        const userId = req.user?.id;
        updateAllBtradeStocksUtil()
            .then(async (result) => {
            if (userId) {
                await createEventUtil({
                    userId,
                    department: "arts",
                    description: `Оновлено btradeStock для всіх артикулів: ${result.updated} з ${result.total} шт. (помилок: ${result.errors}, не знайдено: ${result.notFound})`,
                });
            }
        })
            .catch((error) => {
            logModuleError("arts", error, "Error in background updateAllBtradeStocks:");
        });
        // Сразу возвращаем ответ клиенту
        res.status(202).json({
            message: "BtradeStock update process started",
        });
    }
    catch (error) {
        logModuleError("arts", error, "Error starting btradeStock update:");
        if (!res.headersSent) {
            res.status(500).json({
                message: "Server error",
                error: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
};

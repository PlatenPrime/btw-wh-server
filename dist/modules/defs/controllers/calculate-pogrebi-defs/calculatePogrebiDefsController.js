import { getCalculationStatus } from "../../utils/calculationStatus.js";
import { calculateAndSavePogrebiDefsUtil } from "./utils/calculateAndSavePogrebiDefsUtil.js";
import { calculatePogrebiDefsSchema } from "./schemas/calculatePogrebiDefsSchema.js";
/**
 * @desc    Выполнить расчет дефицитов и сохранить результат в БД
 * @route   POST /api/defs/calculate
 * @access  Private
 */
export const calculatePogrebiDefsController = async (req, res) => {
    try {
        // Валидация входных данных
        const parseResult = calculatePogrebiDefsSchema.safeParse({});
        if (!parseResult.success) {
            res.status(400).json({
                message: "Validation error",
                errors: parseResult.error.errors,
            });
            return;
        }
        // Проверяем, не выполняется ли уже расчет
        const currentStatus = getCalculationStatus();
        if (currentStatus.isRunning) {
            res.status(409).json({
                success: false,
                message: "Розрахунок вже виконується",
                error: "Calculation is already in progress",
            });
            return;
        }
        // Выполняем расчет дефицитов и сохраняем в БД
        const savedDef = await calculateAndSavePogrebiDefsUtil();
        res.status(201).json({
            success: true,
            message: "Deficit calculation completed and saved successfully",
            data: {
                total: savedDef.total,
                totalCriticalDefs: savedDef.totalCriticalDefs,
                totalLimitDefs: savedDef.totalLimitDefs,
                createdAt: savedDef.createdAt,
            },
        });
        return;
    }
    catch (error) {
        console.error("Error in calculatePogrebiDefsController:", error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: "Failed to calculate and save deficits",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
};

import { enrichDefsWithAsksUtil } from "./utils/enrichDefsWithAsksUtil.js";
import { calculateLivePogrebiDefsUtil } from "./utils/calculateLivePogrebiDefsUtil.js";
import { getLatestDefsSchema } from "./schemas/getLatestDefsSchema.js";
import { logModuleError } from "../../../../logging/logModuleError.js";
/**
 * @desc    Живой расчёт дефицитов (poses + product_rests) с existingAsk
 * @route   GET /api/defs/latest
 * @access  Private
 */
export const getLatestDefsController = async (req, res) => {
    try {
        const parseResult = getLatestDefsSchema.safeParse({});
        if (!parseResult.success) {
            res.status(400).json({
                message: "Validation error",
                errors: parseResult.error.errors,
            });
            return;
        }
        const liveDefs = await calculateLivePogrebiDefsUtil();
        const resultWithAsks = await enrichDefsWithAsksUtil(liveDefs.result);
        res.status(200).json({
            exists: true,
            message: "Latest deficit calculation retrieved successfully",
            data: {
                result: resultWithAsks,
                total: liveDefs.total,
                totalCriticalDefs: liveDefs.totalCriticalDefs,
                totalLimitDefs: liveDefs.totalLimitDefs,
                calculatedAt: liveDefs.calculatedAt,
            },
        });
        return;
    }
    catch (error) {
        logModuleError("defs", error, "Error in getLatestDefsController:");
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: "Failed to get latest deficit calculation",
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
};

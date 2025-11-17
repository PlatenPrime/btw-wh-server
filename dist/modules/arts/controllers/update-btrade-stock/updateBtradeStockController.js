import { updateBtradeStockSchema } from "./schemas/updateBtradeStockSchema.js";
import { updateBtradeStockUtil } from "../../utils/updateBtradeStockUtil.js";
/**
 * @desc    Обновить btradeStock для одного артикула
 * @route   PATCH /api/arts/:artikul/btrade-stock
 * @access  Private (ADMIN)
 */
export const updateBtradeStockController = async (req, res) => {
    try {
        const { artikul } = req.params;
        // Валидация входных данных
        const parseResult = updateBtradeStockSchema.safeParse({ artikul });
        if (!parseResult.success) {
            res.status(400).json({
                message: "Validation error",
                errors: parseResult.error.errors,
            });
            return;
        }
        // Обновление btradeStock
        const updatedArt = await updateBtradeStockUtil({
            artikul: parseResult.data.artikul,
        });
        if (!updatedArt) {
            res.status(404).json({
                message: "Art not found or product not found on sharik.ua",
            });
            return;
        }
        res.status(200).json({
            message: "BtradeStock updated successfully",
            data: updatedArt,
        });
    }
    catch (error) {
        console.error("Error updating btradeStock:", error);
        if (!res.headersSent) {
            res.status(500).json({
                message: "Server error",
                error: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
};

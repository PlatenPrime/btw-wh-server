import { updateDelArtikulSchema } from "./schemas/updateDelArtikulSchema.js";
import { updateDelArtikulByDelIdUtil } from "./utils/updateDelArtikulByDelIdUtil.js";
/**
 * @desc    Обновить значение указанного артикула в поставке (данные с sharik.ua)
 * @route   PATCH /api/dels/:id/artikuls/:artikul
 */
export const updateDelArtikulByDelIdController = async (req, res) => {
    try {
        const { id, artikul } = req.params;
        const parseResult = updateDelArtikulSchema.safeParse({ id, artikul });
        if (!parseResult.success) {
            res.status(400).json({
                message: "Validation error",
                errors: parseResult.error.errors,
            });
            return;
        }
        const del = await updateDelArtikulByDelIdUtil({
            delId: parseResult.data.id,
            artikul: parseResult.data.artikul,
        });
        if (!del) {
            res.status(404).json({
                message: "Del not found or product not found on sharik.ua for this artikul",
            });
            return;
        }
        res.status(200).json({
            message: "Del artikul updated successfully",
            data: del,
        });
    }
    catch (error) {
        console.error("Error updating del artikul:", error);
        if (!res.headersSent) {
            res.status(500).json({
                message: "Server error",
                error: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
};

import { updateArtLimitSchema } from "./schemas/updateArtLimitSchema.js";
import { updateArtLimitUtil } from "./utils/updateArtLimitUtil.js";
import { logModuleError } from "../../../../logging/logModuleError.js";
import { createEventUtil } from "../../../events/utils/createEventUtil.js";
export const updateArtLimitController = async (req, res) => {
    try {
        const { id } = req.params;
        const { limit } = req.body;
        // Валидация входных данных
        const parseResult = updateArtLimitSchema.safeParse({ id, limit });
        if (!parseResult.success) {
            res.status(400).json({
                message: "Validation error",
                errors: parseResult.error.errors,
            });
            return;
        }
        // Обновление лимита
        const updatedArt = await updateArtLimitUtil({
            id: parseResult.data.id,
            limit: parseResult.data.limit,
        });
        if (!updatedArt) {
            res.status(404).json({
                message: "Art not found",
            });
            return;
        }
        if (req.user?.id) {
            await createEventUtil({
                userId: req.user.id,
                department: "arts",
                description: `Оновлено лімiт артикулу ${updatedArt.artikul} (id: ${updatedArt._id}) на ${updatedArt.limit}`,
            });
        }
        res.status(200).json(updatedArt);
    }
    catch (error) {
        logModuleError("arts", error, "Error updating art limit:");
        if (!res.headersSent) {
            res.status(500).json({
                message: "Server error",
                error: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
};

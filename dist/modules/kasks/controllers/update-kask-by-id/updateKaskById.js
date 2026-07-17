import { updateKaskBodySchema, updateKaskByIdParamsSchema, } from "./schemas/updateKaskByIdSchema.js";
import { updateKaskUtil } from "./utils/updateKaskUtil.js";
import { logModuleError } from "../../../../logging/logModuleError.js";
import { createEventUtil } from "../../../events/utils/createEventUtil.js";
export const updateKaskById = async (req, res) => {
    try {
        const paramsResult = updateKaskByIdParamsSchema.safeParse(req.params);
        if (!paramsResult.success) {
            res.status(400).json({
                message: "Validation error",
                errors: paramsResult.error.errors,
            });
            return;
        }
        const bodyResult = updateKaskBodySchema.safeParse(req.body);
        if (!bodyResult.success) {
            res.status(400).json({
                message: "Validation error",
                errors: bodyResult.error.errors,
            });
            return;
        }
        const kask = await updateKaskUtil(paramsResult.data.id, bodyResult.data);
        if (!kask) {
            res.status(404).json({ message: "Kask not found" });
            return;
        }
        if (req.user?.id) {
            await createEventUtil({
                userId: req.user.id,
                department: "kasks",
                type: "edit",
                description: `Оновлено касовий запит на артикул ${kask.artikul} (id: ${paramsResult.data.id})`,
            });
        }
        res.status(200).json({
            message: "Kask updated successfully",
            data: kask,
        });
    }
    catch (error) {
        logModuleError("kasks", error, "Error updating kask:");
        res.status(500).json({
            message: "Server error while updating kask",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

import { deleteKaskByIdSchema } from "./schemas/deleteKaskByIdSchema.js";
import { deleteKaskUtil } from "./utils/deleteKaskUtil.js";
import { logModuleError } from "../../../../logging/logModuleError.js";
import { createEventUtil } from "../../../events/utils/createEventUtil.js";
export const deleteKaskById = async (req, res) => {
    try {
        const { id } = req.params;
        const parseResult = deleteKaskByIdSchema.safeParse({ id });
        if (!parseResult.success) {
            res.status(400).json({
                message: "Validation error",
                errors: parseResult.error.errors,
            });
            return;
        }
        const kask = await deleteKaskUtil(parseResult.data.id);
        if (!kask) {
            res.status(404).json({ message: "Kask not found" });
            return;
        }
        if (req.user?.id) {
            await createEventUtil({
                userId: req.user.id,
                department: "kasks",
                description: `Видалено касовий запит на артикул ${kask.artikul} (id: ${id})`,
            });
        }
        res.status(200).json({
            message: "Kask deleted successfully",
            data: { id, artikul: kask.artikul },
        });
    }
    catch (error) {
        logModuleError("kasks", error, "Error deleting kask:");
        res.status(500).json({
            message: "Server error while deleting kask",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

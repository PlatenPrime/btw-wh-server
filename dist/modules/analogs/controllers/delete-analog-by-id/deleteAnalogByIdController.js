import { deleteAnalogByIdSchema } from "./schemas/deleteAnalogByIdSchema.js";
import { deleteAnalogByIdUtil } from "./utils/deleteAnalogByIdUtil.js";
import { logModuleError } from "../../../../logging/logModuleError.js";
import { createEventUtil } from "../../../events/utils/createEventUtil.js";
/**
 * @desc    Удалить аналог по id
 * @route   DELETE /api/analogs/id/:id
 */
export const deleteAnalogByIdController = async (req, res) => {
    try {
        const { id } = req.params;
        const parseResult = deleteAnalogByIdSchema.safeParse({ id });
        if (!parseResult.success) {
            res.status(400).json({
                message: "Validation error",
                errors: parseResult.error.errors,
            });
            return;
        }
        const analog = await deleteAnalogByIdUtil(parseResult.data.id);
        if (!analog) {
            res.status(404).json({ message: "Analog not found" });
            return;
        }
        if (req.user?.id) {
            await createEventUtil({
                userId: req.user.id,
                department: "analogs",
                type: "delete",
                description: `Видалено аналог артикулу ${analog.artikul} (id: ${analog._id})`,
            });
        }
        res.status(200).json({ message: "Analog deleted successfully" });
    }
    catch (error) {
        logModuleError("analogs", error, "Error deleting analog:");
        if (!res.headersSent) {
            res.status(500).json({
                message: "Server error",
                error: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
};

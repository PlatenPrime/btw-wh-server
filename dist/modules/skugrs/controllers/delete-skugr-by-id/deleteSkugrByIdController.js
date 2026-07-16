import { deleteSkugrByIdSchema } from "./schemas/deleteSkugrByIdSchema.js";
import { deleteSkugrByIdUtil } from "./utils/deleteSkugrByIdUtil.js";
import { logModuleError } from "../../../../logging/logModuleError.js";
import { createEventUtil } from "../../../events/utils/createEventUtil.js";
/**
 * @desc    Удалить группу товаров конкурента по id
 * @route   DELETE /api/skugrs/id/:id
 */
export const deleteSkugrByIdController = async (req, res) => {
    try {
        const parseResult = deleteSkugrByIdSchema.safeParse({ id: req.params.id });
        if (!parseResult.success) {
            res.status(400).json({
                message: "Validation error",
                errors: parseResult.error.errors,
            });
            return;
        }
        const skugr = await deleteSkugrByIdUtil(parseResult.data.id);
        if (!skugr) {
            res.status(404).json({ message: "Skugr not found" });
            return;
        }
        if (req.user?.id) {
            await createEventUtil({
                userId: req.user.id,
                department: "skugrs",
                description: `Видалено товарну групу "${skugr.title}" (id: ${skugr._id})`,
            });
        }
        res.status(200).json({
            message: "Skugr deleted successfully",
        });
    }
    catch (error) {
        logModuleError("skugrs", error, "Error deleting skugr:");
        if (!res.headersSent) {
            res.status(500).json({
                message: "Server error",
                error: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
};

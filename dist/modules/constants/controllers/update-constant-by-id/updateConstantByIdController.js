import { updateConstantByIdSchema } from "./schemas/updateConstantByIdSchema.js";
import { updateConstantByIdUtil } from "./utils/updateConstantByIdUtil.js";
/**
 * @desc    Обновить константу по id (указанные в body поля)
 * @route   PATCH /api/constants/id/:id
 */
export const updateConstantByIdController = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, title, data } = req.body;
        const parseResult = updateConstantByIdSchema.safeParse({
            id,
            name,
            title,
            data,
        });
        if (!parseResult.success) {
            res.status(400).json({
                message: "Validation error",
                errors: parseResult.error.errors,
            });
            return;
        }
        const constant = await updateConstantByIdUtil({
            id: parseResult.data.id,
            name: parseResult.data.name,
            title: parseResult.data.title,
            data: parseResult.data.data,
        });
        if (!constant) {
            res.status(404).json({ message: "Constant not found" });
            return;
        }
        res.status(200).json({
            message: "Constant updated successfully",
            data: constant,
        });
    }
    catch (error) {
        console.error("Error updating constant:", error);
        if (!res.headersSent) {
            res.status(500).json({
                message: "Server error",
                error: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
};

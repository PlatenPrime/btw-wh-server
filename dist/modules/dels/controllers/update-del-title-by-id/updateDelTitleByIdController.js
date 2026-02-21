import { updateDelTitleSchema } from "./schemas/updateDelTitleSchema.js";
import { updateDelTitleByIdUtil } from "./utils/updateDelTitleByIdUtil.js";
/**
 * @desc    Обновить название поставки
 * @route   PATCH /api/dels/:id/title
 */
export const updateDelTitleByIdController = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, prodName } = req.body;
        const parseResult = updateDelTitleSchema.safeParse({ id, title, prodName });
        if (!parseResult.success) {
            res.status(400).json({
                message: "Validation error",
                errors: parseResult.error.errors,
            });
            return;
        }
        const result = await updateDelTitleByIdUtil({
            id: parseResult.data.id,
            title: parseResult.data.title,
            prodName: parseResult.data.prodName,
        });
        if (result != null && "error" in result) {
            res.status(400).json({
                message: "Производитель с указанным name не найден",
            });
            return;
        }
        if (!result) {
            res.status(404).json({ message: "Del not found" });
            return;
        }
        res.status(200).json({
            message: "Del title updated successfully",
            data: result,
        });
    }
    catch (error) {
        console.error("Error updating del title:", error);
        if (!res.headersSent) {
            res.status(500).json({
                message: "Server error",
                error: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
};

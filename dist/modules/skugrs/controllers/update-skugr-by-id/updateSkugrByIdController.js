import { toSkugrDto } from "../../utils/toSkugrDto.js";
import { updateSkugrByIdSchema } from "./schemas/updateSkugrByIdSchema.js";
import { updateSkugrByIdUtil } from "./utils/updateSkugrByIdUtil.js";
/**
 * @desc    Обновить поля skugr (konkName, prodName, title, url, isSliced)
 * @route   PATCH /api/skugrs/id/:id
 */
export const updateSkugrByIdController = async (req, res) => {
    try {
        const parseResult = updateSkugrByIdSchema.safeParse({
            id: req.params.id,
            konkName: req.body.konkName,
            prodName: req.body.prodName,
            title: req.body.title,
            url: req.body.url,
            isSliced: req.body.isSliced,
        });
        if (!parseResult.success) {
            res.status(400).json({
                message: "Validation error",
                errors: parseResult.error.errors,
            });
            return;
        }
        const skugr = await updateSkugrByIdUtil(parseResult.data);
        if (!skugr) {
            res.status(404).json({ message: "Skugr not found" });
            return;
        }
        res.status(200).json({
            message: "Skugr updated successfully",
            data: toSkugrDto(skugr),
        });
    }
    catch (error) {
        console.error("Error updating skugr:", error);
        if (!res.headersSent) {
            res.status(500).json({
                message: "Server error",
                error: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
};

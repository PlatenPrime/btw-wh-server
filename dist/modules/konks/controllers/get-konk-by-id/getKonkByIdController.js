import { getKonkByIdSchema } from "./schemas/getKonkByIdSchema.js";
import { getKonkByIdUtil } from "./utils/getKonkByIdUtil.js";
/**
 * @desc    Получить конкурента по id
 * @route   GET /api/konks/id/:id
 */
export const getKonkByIdController = async (req, res) => {
    try {
        const { id } = req.params;
        const parseResult = getKonkByIdSchema.safeParse({ id });
        if (!parseResult.success) {
            res.status(400).json({
                message: "Validation error",
                errors: parseResult.error.errors,
            });
            return;
        }
        const konk = await getKonkByIdUtil(parseResult.data.id);
        if (!konk) {
            res.status(404).json({ message: "Konk not found" });
            return;
        }
        res.status(200).json({
            message: "Konk retrieved successfully",
            data: konk,
        });
    }
    catch (error) {
        console.error("Error fetching konk by id:", error);
        if (!res.headersSent) {
            res.status(500).json({
                message: "Server error",
                error: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
};

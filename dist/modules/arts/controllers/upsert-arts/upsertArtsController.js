import { upsertArtsSchema } from "./schemas/upsertArtsSchema.js";
import { upsertArtsUtil } from "./utils/upsertArtsUtil.js";
export const upsertArtsController = async (req, res) => {
    try {
        // Валидация входных данных
        const parseResult = upsertArtsSchema.safeParse(req.body);
        if (!parseResult.success) {
            res.status(400).json({
                message: "Validation error",
                errors: parseResult.error.errors,
            });
            return;
        }
        const arts = parseResult.data;
        const result = await upsertArtsUtil({ arts });
        res.status(200).json({ message: "Upsert completed", result });
    }
    catch (error) {
        console.error("Upsert error:", error);
        if (!res.headersSent) {
            res.status(500).json({
                message: "Server error",
                error: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
};

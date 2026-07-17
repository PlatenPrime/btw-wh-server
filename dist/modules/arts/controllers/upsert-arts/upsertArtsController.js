import { upsertArtsSchema } from "./schemas/upsertArtsSchema.js";
import { upsertArtsUtil } from "./utils/upsertArtsUtil.js";
import { logModuleError } from "../../../../logging/logModuleError.js";
import { createEventUtil } from "../../../events/utils/createEventUtil.js";
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
        if (req.user?.id) {
            await createEventUtil({
                userId: req.user.id,
                department: "arts",
                type: "other",
                description: `Виконано upsert артикулів: ${arts.length} шт. (додано: ${result.upsertedCount}, оновлено: ${result.modifiedCount})`,
            });
        }
        res.status(200).json({ message: "Upsert completed", result });
    }
    catch (error) {
        logModuleError("arts", error, "Upsert error:");
        if (!res.headersSent) {
            res.status(500).json({
                message: "Server error",
                error: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
};

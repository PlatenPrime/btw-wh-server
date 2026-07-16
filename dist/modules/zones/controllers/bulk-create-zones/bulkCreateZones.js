import { createEventUtil } from "../../../events/utils/createEventUtil.js";
import { bulkCreateZonesSchema } from "./schemas/bulkCreateZonesSchema.js";
import { bulkCreateZonesUtil } from "./utils/bulkCreateZonesUtil.js";
import { logModuleError } from "../../../../logging/logModuleError.js";
export const upsertZones = async (req, res) => {
    try {
        // Валидация входных данных
        const parseResult = bulkCreateZonesSchema.safeParse(req.body);
        if (!parseResult.success) {
            res.status(400).json({
                message: "Validation error",
                errors: parseResult.error.errors,
            });
            return;
        }
        const { zones } = parseResult.data;
        if (!Array.isArray(zones) || zones.length === 0) {
            res.status(400).json({ message: "Invalid or empty data" });
            return;
        }
        const result = await bulkCreateZonesUtil({ zones });
        if (req.user?.id) {
            await createEventUtil({
                userId: req.user.id,
                department: "zones",
                description: `Масовий upsert зон: додано ${result.upsertedCount}, оновлено ${result.modifiedCount} з ${zones.length} переданих`,
            });
        }
        res.status(200).json({ message: "Upsert completed", result });
    }
    catch (error) {
        logModuleError("zones", error, "Upsert error:");
        if (!res.headersSent) {
            res.status(500).json({ message: "Server error", error });
        }
    }
};

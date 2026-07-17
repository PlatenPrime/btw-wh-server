import { createEventUtil } from "../../../events/utils/createEventUtil.js";
import { createZoneSchema } from "./schemas/createZoneSchema.js";
import { checkZoneDuplicatesUtil } from "./utils/checkZoneDuplicatesUtil.js";
import { createZoneUtil } from "./utils/createZoneUtil.js";
import { logModuleError } from "../../../../logging/logModuleError.js";
export const createZone = async (req, res) => {
    try {
        // Валидация входных данных
        const parseResult = createZoneSchema.safeParse(req.body);
        if (!parseResult.success) {
            res.status(400).json({
                message: "Validation error",
                errors: parseResult.error.errors,
            });
            return;
        }
        const zoneData = parseResult.data;
        // Проверка на дубликаты
        const duplicateZone = await checkZoneDuplicatesUtil(zoneData);
        if (duplicateZone) {
            const duplicateFields = [];
            if (duplicateZone.title === zoneData.title)
                duplicateFields.push("title");
            if (duplicateZone.bar === zoneData.bar)
                duplicateFields.push("bar");
            res.status(409).json({
                message: "Zone with this data already exists",
                duplicateFields,
            });
            return;
        }
        // Создание новой зоны
        const zone = await createZoneUtil(zoneData);
        if (req.user?.id) {
            await createEventUtil({
                userId: req.user.id,
                department: "zones",
                type: "create",
                description: `Створено зону ${zone.title} (бар: ${zone.bar})`,
            });
        }
        res.status(201).json({
            message: "Zone created successfully",
            data: zone,
        });
    }
    catch (error) {
        logModuleError("zones", error, "Error creating zone:");
        // Обработка ошибок MongoDB
        if (error instanceof Error && error.name === "MongoServerError") {
            const mongoError = error;
            if (mongoError.code === 11000) {
                const duplicateField = Object.keys(mongoError.keyPattern)[0];
                res.status(409).json({
                    message: `Zone with this ${duplicateField} already exists`,
                });
                return;
            }
        }
        if (!res.headersSent) {
            res.status(500).json({
                message: "Server error",
                error: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
};

import { createBlockSchema } from "./schemas/createBlockSchema.js";
import { checkBlockDuplicatesUtil } from "./utils/checkBlockDuplicatesUtil.js";
import { createBlockUtil } from "./utils/createBlockUtil.js";
export const createBlock = async (req, res) => {
    try {
        // Валидация входных данных
        const parseResult = createBlockSchema.safeParse(req.body);
        if (!parseResult.success) {
            res.status(400).json({
                message: "Validation error",
                errors: parseResult.error.errors,
            });
            return;
        }
        const blockData = parseResult.data;
        // Проверка на дубликаты
        const duplicateBlock = await checkBlockDuplicatesUtil(blockData);
        if (duplicateBlock) {
            res.status(409).json({
                message: "Block with this title already exists",
                duplicateFields: ["title"],
            });
            return;
        }
        // Создание нового блока
        const block = await createBlockUtil(blockData);
        res.status(201).json({
            message: "Block created successfully",
            data: block,
        });
    }
    catch (error) {
        console.error("Error creating block:", error);
        // Обработка ошибок MongoDB
        if (error instanceof Error && error.name === "MongoServerError") {
            const mongoError = error;
            if (mongoError.code === 11000) {
                const duplicateField = Object.keys(mongoError.keyPattern)[0];
                res.status(409).json({
                    message: `Block with this ${duplicateField} already exists`,
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

import { createEventUtil } from "../../../events/utils/createEventUtil.js";
import { populateMissingPosDataUtil } from "./utils/populateMissingPosDataUtil.js";
export const populateMissingPosDataController = async (req, res) => {
    try {
        // 1. Выполняем заполнение данных
        const result = await populateMissingPosDataUtil();
        if (req.user?.id) {
            await createEventUtil({
                userId: req.user.id,
                department: "poses",
                description: `Заповнено відсутні дані позицій: оновлено ${result.updated}, помилок ${result.errors}`,
            });
        }
        // 2. HTTP ответ
        res.status(200).json({
            updated: result.updated,
            errors: result.errors,
            errorDetails: result.errorDetails,
        });
    }
    catch (error) {
        // 3. Обработка ошибок
        res.status(500).json({
            error: error instanceof Error ? error.message : "Internal server error",
        });
    }
};

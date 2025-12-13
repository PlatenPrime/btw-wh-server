import { checkAndCompleteAsksUtil } from "./utils/checkAndCompleteAsksUtil.js";
import { getAsksPullsUtil } from "./utils/getAsksPullsUtil.js";
export const getAsksPullsController = async (req, res) => {
    try {
        const { response, processingAsks } = await getAsksPullsUtil();
        // Отправляем ответ клиенту
        res.status(200).json({
            message: "Asks pulls retrieved successfully",
            data: response,
        });
        // После отправки ответа обрабатываем готовые asks в фоне
        // Используем setImmediate для неблокирующей асинхронной обработки
        setImmediate(async () => {
            try {
                const completedAskIds = await checkAndCompleteAsksUtil(processingAsks);
                if (completedAskIds.length > 0) {
                    console.log(`Automatically completed ${completedAskIds.length} asks:`, completedAskIds);
                }
            }
            catch (error) {
                // Логируем ошибку, но не прерываем выполнение
                console.error("Error completing asks in background:", error);
            }
        });
    }
    catch (error) {
        console.error("Error fetching asks pulls:", error);
        res.status(500).json({
            message: "Server error while fetching asks pulls",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
};

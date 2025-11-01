import { getPosesByRowIdUtil } from "./utils/getPosesByRowIdUtil.js";
export const getPosesByRowIdController = async (req, res) => {
    const { rowId } = req.params;
    try {
        // 1. Получаем позиции через утилиту
        const poses = await getPosesByRowIdUtil(rowId);
        // 2. HTTP ответ
        res.status(200).json(poses);
    }
    catch (error) {
        // 3. Обработка ошибок
        if (!res.headersSent) {
            if (error instanceof Error && error.message === "Invalid row ID") {
                res.status(400).json({ error: "Invalid row ID" });
            }
            else {
                res.status(500).json({
                    error: "Failed to fetch poses by row",
                    details: error,
                });
            }
        }
    }
};

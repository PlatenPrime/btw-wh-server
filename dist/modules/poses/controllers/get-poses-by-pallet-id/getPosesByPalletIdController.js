import { getPosesByPalletIdUtil } from "./utils/getPosesByPalletIdUtil.js";
export const getPosesByPalletIdController = async (req, res) => {
    const { palletId } = req.params;
    try {
        // 1. Получаем позиции через утилиту
        const poses = await getPosesByPalletIdUtil(palletId);
        // 2. HTTP ответ
        res.status(200).json(poses);
    }
    catch (error) {
        // 3. Обработка ошибок
        if (!res.headersSent) {
            if (error instanceof Error && error.message === "Invalid pallet ID") {
                res.status(400).json({ error: "Invalid pallet ID" });
            }
            else {
                res.status(500).json({
                    error: "Failed to fetch poses by pallet",
                    details: error,
                });
            }
        }
    }
};

import mongoose from "mongoose";
import { Pos } from "../../models/Pos.js";
import { updatePosSchema } from "./schemas/updatePosSchema.js";
import { updatePosUtil } from "./utils/updatePosUtil.js";
export const updatePosController = async (req, res) => {
    const { id } = req.params;
    // 1. Валидация ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ error: "Invalid position ID" });
        return;
    }
    // 2. Валидация body
    const parseResult = updatePosSchema.safeParse(req.body);
    if (!parseResult.success) {
        res.status(400).json({ error: parseResult.error.errors });
        return;
    }
    const session = await mongoose.startSession();
    try {
        // 3. Оркестрация в транзакции
        await session.withTransaction(async () => {
            const pos = await Pos.findById(id).session(session);
            if (!pos) {
                throw new Error("Position not found");
            }
            await updatePosUtil({
                posId: id,
                updateData: parseResult.data,
                session,
            });
        });
        // 4. Получаем обновлённую позицию для ответа
        const updatedPos = await Pos.findById(id);
        // 5. HTTP ответ
        res.status(200).json(updatedPos);
    }
    catch (error) {
        // 6. Обработка ошибок
        if (!res.headersSent) {
            if (error instanceof Error && error.message === "Position not found") {
                res.status(404).json({ error: "Position not found" });
            }
            else {
                res.status(500).json({
                    error: "Failed to update position",
                    details: error,
                });
            }
        }
    }
    finally {
        await session.endSession();
    }
};

import mongoose from "mongoose";
import { createEventUtil } from "../../../events/utils/createEventUtil.js";
import { Pallet } from "../../../pallets/models/Pallet.js";
import { deletePosUtil } from "./utils/deletePosUtil.js";
export const deletePosController = async (req, res) => {
    const { id } = req.params;
    // 1. Валидация ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ error: "Invalid position ID" });
        return;
    }
    const session = await mongoose.startSession();
    let deletedPos = null;
    try {
        // 2. Оркестрация в транзакции
        await session.withTransaction(async () => {
            deletedPos = await deletePosUtil({ posId: id, session });
            // Удаляем позицию из паллета
            const pallet = await Pallet.findById(deletedPos.pallet._id).session(session);
            if (pallet) {
                pallet.poses = pallet.poses.filter((posId) => posId.toString() !== id);
                await pallet.save({ session });
            }
        });
        const deletedPosData = deletedPos;
        if (req.user?.id && deletedPosData) {
            await createEventUtil({
                userId: req.user.id,
                department: "poses",
                type: "delete",
                description: `Видалено позицію ${deletedPosData.artikul} (${deletedPosData.quant} шт, ${deletedPosData.boxes} ящ) з паллети ${deletedPosData.palletTitle}`,
            });
        }
        // 3. HTTP ответ
        res.status(200).json({ message: "Position deleted successfully" });
    }
    catch (error) {
        // 4. Обработка ошибок
        if (!res.headersSent) {
            if (error instanceof Error && error.message === "Position not found") {
                res.status(404).json({ error: "Position not found" });
            }
            else {
                res.status(500).json({
                    error: "Failed to delete position",
                    details: error,
                });
            }
        }
    }
    finally {
        await session.endSession();
    }
};

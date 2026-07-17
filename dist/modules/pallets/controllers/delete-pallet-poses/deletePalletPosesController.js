import mongoose from "mongoose";
import { createEventUtil } from "../../../events/utils/createEventUtil.js";
import { Pallet } from "../../models/Pallet.js";
import { deletePalletPosesSchema } from "./schemas/deletePalletPosesSchema.js";
import { deletePalletPosesUtil } from "./utils/deletePalletPosesUtil.js";
import { logModuleError } from "../../../../logging/logModuleError.js";
export const deletePalletPosesController = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        const { id } = req.params;
        // Валидация входных данных
        const parseResult = deletePalletPosesSchema.safeParse({ id });
        if (!parseResult.success) {
            res.status(400).json({
                message: "Validation error",
                errors: parseResult.error.errors,
            });
            return;
        }
        let palletTitle;
        let removedCount = 0;
        // Транзакция для удаления poses
        await session.withTransaction(async () => {
            const pallet = await Pallet.findById(id).session(session);
            palletTitle = pallet?.title;
            removedCount = pallet?.poses?.length ?? 0;
            await deletePalletPosesUtil({
                palletId: id,
                session,
            });
        });
        if (req.user?.id) {
            await createEventUtil({
                userId: req.user.id,
                department: "pallets",
                type: "delete",
                description: `Видалено ${removedCount} позицій з паллети ${palletTitle ?? id}`,
            });
        }
        res.status(200).json({
            message: "Pallet poses removed successfully",
        });
    }
    catch (error) {
        if (!res.headersSent) {
            if (error instanceof Error && error.message === "Pallet not found") {
                res.status(404).json({ message: "Pallet not found" });
            }
            else {
                logModuleError("pallets", error, "deletePalletPosesController error:");
                res.status(500).json({
                    message: "Server error",
                    error: error instanceof Error ? error.message : error,
                });
            }
        }
    }
    finally {
        await session.endSession();
    }
};

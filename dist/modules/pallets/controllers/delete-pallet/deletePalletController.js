import mongoose from "mongoose";
import { createEventUtil } from "../../../events/utils/createEventUtil.js";
import { Pallet } from "../../models/Pallet.js";
import { deletePalletSchema } from "./schemas/deletePalletSchema.js";
import { deletePalletUtil } from "./utils/deletePalletUtil.js";
import { logModuleError } from "../../../../logging/logModuleError.js";
export const deletePalletController = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        const { id } = req.params;
        // Валидация входных данных
        const parseResult = deletePalletSchema.safeParse({ id });
        if (!parseResult.success) {
            res.status(400).json({
                message: "Validation error",
                errors: parseResult.error.errors,
            });
            return;
        }
        let palletTitle;
        // Транзакция для удаления паллеты
        await session.withTransaction(async () => {
            const pallet = await Pallet.findById(id).session(session);
            palletTitle = pallet?.title;
            await deletePalletUtil({
                palletId: id,
                session,
            });
        });
        if (req.user?.id) {
            await createEventUtil({
                userId: req.user.id,
                department: "pallets",
                description: `Видалено паллету ${palletTitle ?? id}`,
            });
        }
        res.status(200).json({ message: "Pallet deleted" });
    }
    catch (error) {
        if (!res.headersSent) {
            if (error instanceof Error && error.message === "Pallet not found") {
                res.status(404).json({ message: "Pallet not found" });
            }
            else {
                logModuleError("pallets", error, "deletePalletController error:");
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

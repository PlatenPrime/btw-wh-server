import mongoose from "mongoose";
import { deletePalletSchema } from "./schemas/deletePalletSchema.js";
import { deletePalletUtil } from "./utils/deletePalletUtil.js";
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
        // Транзакция для удаления паллеты
        await session.withTransaction(async () => {
            await deletePalletUtil({
                palletId: id,
                session,
            });
        });
        res.status(200).json({ message: "Pallet deleted" });
    }
    catch (error) {
        if (!res.headersSent) {
            if (error instanceof Error && error.message === "Pallet not found") {
                res.status(404).json({ message: "Pallet not found" });
            }
            else {
                console.error("deletePalletController error:", error);
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

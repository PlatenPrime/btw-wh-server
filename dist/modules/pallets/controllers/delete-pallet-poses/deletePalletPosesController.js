import mongoose from "mongoose";
import { deletePalletPosesSchema } from "./schemas/deletePalletPosesSchema.js";
import { deletePalletPosesUtil } from "./utils/deletePalletPosesUtil.js";
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
        // Транзакция для удаления poses
        await session.withTransaction(async () => {
            await deletePalletPosesUtil({
                palletId: id,
                session,
            });
        });
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
                console.error("deletePalletPosesController error:", error);
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

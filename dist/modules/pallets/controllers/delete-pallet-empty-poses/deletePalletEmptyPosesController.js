import mongoose from "mongoose";
import { deletePalletEmptyPosesSchema } from "./schemas/deletePalletEmptyPosesSchema.js";
import { deletePalletEmptyPosesUtil } from "./utils/deletePalletEmptyPosesUtil.js";
export const deletePalletEmptyPosesController = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        const { id } = req.params;
        // Валидация входных данных
        const parseResult = deletePalletEmptyPosesSchema.safeParse({ id });
        if (!parseResult.success) {
            res.status(400).json({
                message: "Validation error",
                errors: parseResult.error.errors,
            });
            return;
        }
        let result = null;
        // Транзакция для удаления пустых poses
        await session.withTransaction(async () => {
            result = await deletePalletEmptyPosesUtil({
                palletId: id,
                session,
            });
        });
        if (result.deletedCount === 0) {
            res.status(200).json({
                message: "No empty poses found in this pallet",
                deletedCount: 0,
            });
            return;
        }
        res.status(200).json({
            message: "Empty poses removed from pallet successfully",
            deletedCount: result.deletedCount,
            affectedPoseIds: result.affectedPoseIds,
        });
    }
    catch (error) {
        if (!res.headersSent) {
            if (error instanceof Error && error.message === "Pallet not found") {
                res.status(404).json({ message: "Pallet not found" });
            }
            else {
                console.error("deletePalletEmptyPosesController error:", error);
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

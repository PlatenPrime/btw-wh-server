import mongoose from "mongoose";
import { updateSegSchema } from "./schemas/updateSegSchema.js";
import { updateSegUtil } from "./utils/updateSegUtil.js";
export const updateSeg = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        const { id } = req.params;
        const body = req.body;
        // Валидация входных данных
        const parseResult = updateSegSchema.safeParse({ id, ...body });
        if (!parseResult.success) {
            res.status(400).json({
                message: "Validation error",
                errors: parseResult.error.errors,
            });
            return;
        }
        const { order, zones } = parseResult.data;
        if (order === undefined && zones === undefined) {
            res.status(400).json({
                message: "At least one field (order or zones) must be provided",
            });
            return;
        }
        let updatedSeg = null;
        // Транзакция для обновления сегмента
        await session.withTransaction(async () => {
            updatedSeg = await updateSegUtil({
                segId: id,
                updateData: { order, zones },
                session,
            });
            if (!updatedSeg) {
                throw new Error("Segment not found");
            }
        });
        res.status(200).json({
            message: "Segment updated successfully",
            data: updatedSeg.toObject(),
        });
    }
    catch (error) {
        if (!res.headersSent) {
            if (error instanceof Error && error.message === "Segment not found") {
                res.status(404).json({ message: "Segment not found" });
            }
            else if (error instanceof Error && error.message.includes("zones")) {
                res.status(400).json({ message: error.message });
            }
            else {
                console.error("updateSeg error:", error);
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

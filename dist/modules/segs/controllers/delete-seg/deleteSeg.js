import mongoose from "mongoose";
import { z } from "zod";
import { deleteSegUtil } from "./utils/deleteSegUtil.js";
const deleteSegSchema = z.object({
    id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid segment ID format",
    }),
});
export const deleteSeg = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        const { id } = req.params;
        // Валидация входных данных
        const parseResult = deleteSegSchema.safeParse({ id });
        if (!parseResult.success) {
            res.status(400).json({
                message: "Validation error",
                errors: parseResult.error.errors,
            });
            return;
        }
        let deletedSeg = null;
        // Транзакция для удаления сегмента
        await session.withTransaction(async () => {
            deletedSeg = await deleteSegUtil({
                segId: id,
                session,
            });
            if (!deletedSeg) {
                throw new Error("Segment not found");
            }
        });
        res.status(200).json({
            message: "Segment deleted successfully",
            data: deletedSeg.toObject(),
        });
    }
    catch (error) {
        if (!res.headersSent) {
            if (error instanceof Error && error.message === "Segment not found") {
                res.status(404).json({ message: "Segment not found" });
            }
            else {
                console.error("deleteSeg error:", error);
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

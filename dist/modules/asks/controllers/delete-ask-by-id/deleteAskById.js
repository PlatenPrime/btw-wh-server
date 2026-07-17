import mongoose from "mongoose";
import { deleteAskByIdSchema } from "./schemas/deleteAskByIdSchema.js";
import { deleteAskUtil } from "./utils/deleteAskUtil.js";
import { logModuleError } from "../../../../logging/logModuleError.js";
import { createEventUtil } from "../../../events/utils/createEventUtil.js";
export const deleteAskById = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        const { id } = req.params;
        // Валидация параметров
        const parseResult = deleteAskByIdSchema.safeParse({ id });
        if (!parseResult.success) {
            res.status(400).json({
                message: "Validation error",
                errors: parseResult.error.errors,
            });
            return;
        }
        let ask = null;
        await session.withTransaction(async () => {
            ask = await deleteAskUtil({
                id: parseResult.data.id,
                session,
            });
            if (!ask) {
                throw new Error("Ask not found");
            }
        });
        if (req.user?.id) {
            await createEventUtil({
                userId: req.user.id,
                department: "asks",
                type: "delete",
                description: `Видалено заявку на артикул ${ask.artikul} (id: ${id})`,
            });
        }
        res.status(200).json({
            message: "Ask deleted successfully",
            data: { id, artikul: ask.artikul },
        });
    }
    catch (error) {
        logModuleError("asks", error, "Error deleting ask by ID:");
        if (!res.headersSent) {
            if (error instanceof Error && error.message === "Ask not found") {
                res.status(404).json({ message: "Ask not found" });
            }
            else {
                res.status(500).json({
                    message: "Server error while deleting ask",
                    error: error instanceof Error ? error.message : "Unknown error",
                });
            }
        }
    }
    finally {
        await session.endSession();
    }
};

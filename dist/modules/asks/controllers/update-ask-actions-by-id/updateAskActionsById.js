import mongoose from "mongoose";
import User from "../../../auth/models/User.js";
import { Ask } from "../../models/Ask.js";
import { updateAskActionsByIdSchema } from "./schemas/updateAskActionsByIdSchema.js";
import { updateAskActionsUtil } from "./utils/updateAskActionsUtil.js";
export const updateAskActionsById = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        const { id } = req.params;
        const { action, userId } = req.body;
        // Валидация входных данных
        const parseResult = updateAskActionsByIdSchema.safeParse({
            id,
            action,
            userId,
        });
        if (!parseResult.success) {
            return res.status(400).json({
                message: "Validation error",
                errors: parseResult.error.errors,
            });
        }
        let updatedAsk = null;
        await session.withTransaction(async () => {
            const existingAsk = await Ask.findById(id).session(session);
            if (!existingAsk) {
                throw new Error("Ask not found");
            }
            const user = await User.findById(userId).session(session);
            if (!user) {
                throw new Error("User not found");
            }
            updatedAsk = await updateAskActionsUtil({
                user,
                ask: existingAsk,
                action: parseResult.data.action,
                session,
            });
        });
        res.status(200).json(updatedAsk);
    }
    catch (error) {
        console.error("Error updating ask actions:", error);
        if (!res.headersSent) {
            if (error instanceof Error && error.message === "Ask not found") {
                res.status(404).json({ message: "Ask not found" });
            }
            else if (error instanceof Error && error.message === "User not found") {
                res.status(404).json({ message: "User not found" });
            }
            else {
                res.status(500).json({ message: "Server error", error });
            }
        }
    }
    finally {
        await session.endSession();
    }
};

import mongoose from "mongoose";
import User from "../../../auth/models/User.js";
import { createAskSchema } from "./schemas/createAskSchema.js";
import { createAskUtil } from "./utils/createAskUtil.js";
import { getCreateAskActionsUtil } from "./utils/getCreateAskActionsUtil.js";
import { getCreateAskMessageUtil } from "./utils/getCreateAskMesUtil.js";
import { sendCreateAskMesUtil } from "./utils/sendCreateAskMesUtil.js";
export const createAskController = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        const { artikul, nameukr, quant, com, sklad, zone, askerId } = req.body;
        // Валидация входных данных
        const parseResult = createAskSchema.safeParse({
            artikul,
            nameukr,
            quant,
            com,
            sklad,
            zone,
            askerId,
        });
        if (!parseResult.success) {
            return res.status(400).json({
                message: "Validation error",
                errors: parseResult.error.errors,
            });
        }
        let askerData = null;
        let createdAsk = null;
        await session.withTransaction(async () => {
            askerData = await User.findById(askerId).session(session);
            if (!askerData) {
                throw new Error("User not found");
            }
            const actions = getCreateAskActionsUtil({
                askerData,
                nameukr: parseResult.data.nameukr || "",
                quant: parseResult.data.quant || 0,
                com: parseResult.data.com || "",
            });
            createdAsk = await createAskUtil({
                artikul: parseResult.data.artikul,
                nameukr: parseResult.data.nameukr,
                quant: parseResult.data.quant || 0,
                com: parseResult.data.com,
                sklad: parseResult.data.sklad,
                zone: parseResult.data.zone,
                askerData,
                actions,
                session,
            });
        });
        res.status(201).json(createdAsk);
        const message = getCreateAskMessageUtil({
            askerData,
            artikul: parseResult.data.artikul,
            nameukr: parseResult.data.nameukr || "",
            quant: parseResult.data.quant || 0,
            com: parseResult.data.com || "",
        });
        await sendCreateAskMesUtil({ message, askerData });
    }
    catch (error) {
        console.error("Error creating ask:", error);
        if (!res.headersSent) {
            if (error instanceof Error && error.message === "User not found") {
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

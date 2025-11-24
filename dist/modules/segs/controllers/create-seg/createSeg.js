import mongoose from "mongoose";
import { Block } from "../../../blocks/models/Block.js";
import { createSegSchema } from "./schemas/createSegSchema.js";
import { createSegUtil } from "./utils/createSegUtil.js";
export const createSeg = async (req, res) => {
    const session = await mongoose.startSession();
    try {
        // Валидация входных данных
        const parseResult = createSegSchema.safeParse(req.body);
        if (!parseResult.success) {
            res.status(400).json({
                message: "Validation error",
                errors: parseResult.error.errors,
            });
            return;
        }
        const { blockData, order, zones } = parseResult.data;
        let createdSeg = null;
        // Транзакция для создания сегмента и обновления Block и Zone
        await session.withTransaction(async () => {
            const blockDoc = await Block.findById(blockData._id).session(session);
            if (!blockDoc) {
                throw new Error("Block not found");
            }
            createdSeg = await createSegUtil({
                blockData: blockDoc,
                order,
                zones,
                session,
            });
        });
        res.status(201).json({
            message: "Segment created successfully",
            data: createdSeg,
        });
    }
    catch (error) {
        if (!res.headersSent) {
            if (error instanceof Error && error.message === "Block not found") {
                res.status(404).json({ message: "Block not found" });
            }
            else if (error instanceof Error && error.message.includes("zones")) {
                res.status(400).json({ message: error.message });
            }
            else {
                console.error("createSeg error:", error);
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

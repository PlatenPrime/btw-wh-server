import mongoose from "mongoose";
import { updateBlockSchema } from "./schemas/updateBlockSchema.js";
import { updateBlockUtil } from "./utils/updateBlockUtil.js";
import { checkBlockDuplicatesUpdateUtil } from "./utils/checkBlockDuplicatesUpdateUtil.js";
import { calculateZonesSectorsUtil } from "../../utils/calculateZonesSectorsUtil.js";
export const updateBlock = async (req, res) => {
    try {
        const { id } = req.params;
        // Проверка валидности ObjectId
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            res.status(400).json({
                message: "Invalid block ID format",
            });
            return;
        }
        // Валидация входных данных
        const parseResult = updateBlockSchema.safeParse(req.body);
        if (!parseResult.success) {
            res.status(400).json({
                message: "Validation error",
                errors: parseResult.error.errors,
            });
            return;
        }
        const updateData = parseResult.data;
        // Проверка существования блока
        const existingBlock = await updateBlockUtil({ id, updateData: {} });
        if (!existingBlock) {
            res.status(404).json({
                message: "Block not found",
            });
            return;
        }
        // Проверка на дубликаты (если обновляется title)
        if (updateData.title) {
            const duplicateBlock = await checkBlockDuplicatesUpdateUtil({
                id,
                title: updateData.title,
            });
            if (duplicateBlock) {
                res.status(409).json({
                    message: "Block with this title already exists",
                    duplicateFields: ["title"],
                });
                return;
            }
        }
        // Обновление блока
        const updatedBlock = await updateBlockUtil({ id, updateData });
        if (!updatedBlock) {
            res.status(404).json({
                message: "Block not found",
            });
            return;
        }
        // Пересчитать сектора всех зон, если изменился order блока или zones
        if (updateData.order !== undefined || updateData.zones !== undefined) {
            await calculateZonesSectorsUtil();
        }
        res.status(200).json({
            message: "Block updated successfully",
            data: updatedBlock,
        });
    }
    catch (error) {
        console.error("Error updating block:", error);
        // Обработка ошибок MongoDB
        if (error instanceof Error && error.name === "MongoServerError") {
            const mongoError = error;
            if (mongoError.code === 11000) {
                const duplicateField = Object.keys(mongoError.keyPattern)[0];
                res.status(409).json({
                    message: `Block with this ${duplicateField} already exists`,
                });
                return;
            }
        }
        // Обработка ошибки валидации зон
        if (error instanceof Error && error.message === "One or more zones not found") {
            res.status(404).json({
                message: error.message,
            });
            return;
        }
        if (!res.headersSent) {
            res.status(500).json({
                message: "Server error",
                error: process.env.NODE_ENV === "development" ? error : undefined,
            });
        }
    }
};

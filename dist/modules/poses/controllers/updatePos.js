import mongoose from "mongoose";
import { z } from "zod";
import { Pallet } from "../../pallets/models/Pallet.js";
import { Row } from "../../rows/models/Row.js";
import { Pos } from "../models/Pos.js";
const updatePosSchema = z.object({
    palletId: z
        .string()
        .refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid pallet ID",
    })
        .optional(),
    rowId: z
        .string()
        .refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid row ID",
    })
        .optional(),
    palletTitle: z.string(),
    rowTitle: z.string(),
    artikul: z.string(),
    quant: z.number(),
    boxes: z.number(),
    date: z.string().optional(),
    sklad: z.string().optional(),
});
export const updatePos = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ error: "Invalid position ID" });
        return;
    }
    const parseResult = updatePosSchema.safeParse(req.body);
    if (!parseResult.success) {
        res.status(400).json({ error: parseResult.error.errors });
        return;
    }
    const session = await mongoose.startSession();
    try {
        await session.withTransaction(async () => {
            const pos = await Pos.findById(id).session(session);
            if (!pos) {
                res.status(404).json({ error: "Position not found" });
                return;
            }
            // Подготавливаем данные для обновления
            const updateData = { ...parseResult.data };
            // Если обновляется palletId, нужно получить новые данные паллета
            if (parseResult.data.palletId) {
                const pallet = await Pallet.findById(parseResult.data.palletId).session(session);
                if (!pallet) {
                    res.status(404).json({ error: "Pallet not found" });
                    return;
                }
                updateData.pallet = {
                    _id: pallet._id,
                    title: pallet.title,
                    sector: pallet.sector,
                };
                // Обновляем кэшированное название паллета
                updateData.palletTitle = pallet.title;
                delete updateData.palletId;
            }
            else {
                // Сохраняем существующий объект паллета
                updateData.pallet = pos.pallet;
            }
            // Если обновляется rowId, нужно получить новые данные ряда
            if (parseResult.data.rowId) {
                const row = await Row.findById(parseResult.data.rowId).session(session);
                if (!row) {
                    res.status(404).json({ error: "Row not found" });
                    return;
                }
                updateData.row = {
                    _id: row._id,
                    title: row.title,
                };
                // Обновляем кэшированное название ряда
                updateData.rowTitle = row.title;
                delete updateData.rowId;
            }
            else {
                // Сохраняем существующий объект ряда
                updateData.row = pos.row;
            }
            // Обновляем позицию
            const updatedPos = await Pos.findByIdAndUpdate(id, updateData, {
                new: true,
                runValidators: true,
                session,
            });
            res.json(updatedPos);
        });
    }
    catch (error) {
        if (!res.headersSent) {
            const errorMessage = error instanceof Error ? error.message : "Failed to update position";
            const statusCode = errorMessage.includes("not found") ? 404 : 500;
            res.status(statusCode).json({
                error: statusCode === 500 ? "Failed to update position" : errorMessage,
                ...(statusCode === 500 && { details: error }),
            });
        }
    }
    finally {
        await session.endSession();
    }
};

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
    try {
        const pos = await Pos.findById(id);
        if (!pos) {
            res.status(404).json({ error: "Position not found" });
            return;
        }
        // Подготавливаем данные для обновления
        const updateData = { ...parseResult.data };
        // Если обновляются palletId или rowId, нужно получить новые данные
        if (parseResult.data.palletId) {
            const pallet = await Pallet.findById(parseResult.data.palletId);
            if (!pallet) {
                res.status(404).json({ error: "Pallet not found" });
                return;
            }
            updateData.pallet = {
                _id: pallet._id,
                title: pallet.title,
                sector: pallet.sector,
            };
            delete updateData.palletId;
        }
        if (parseResult.data.rowId) {
            const row = await Row.findById(parseResult.data.rowId);
            if (!row) {
                res.status(404).json({ error: "Row not found" });
                return;
            }
            updateData.row = {
                _id: row._id,
                title: row.title,
            };
            delete updateData.rowId;
        }
        // Обновляем позицию
        const updatedPos = await Pos.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        });
        res.json(updatedPos);
    }
    catch (error) {
        res
            .status(500)
            .json({ error: "Failed to update position", details: error });
    }
};

import mongoose from "mongoose";
import { z } from "zod";
import { Row } from "../../rows/models/Row.js";
import { Pallet } from "../models/Pallet.js";
const createPalletSchema = z.object({
    title: z.string().min(1),
    rowId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid row ID",
    }),
    poses: z
        .array(z.string().refine((val) => mongoose.Types.ObjectId.isValid(val)))
        .optional(),
    sector: z.string().optional(),
});
export const createPallet = async (req, res) => {
    const parseResult = createPalletSchema.safeParse(req.body);
    if (!parseResult.success) {
        res.status(400).json({ error: parseResult.error.errors });
        return;
    }
    const { title, rowId, poses, sector } = parseResult.data;
    try {
        const rowDoc = await Row.findById(rowId);
        if (!rowDoc) {
            res.status(404).json({ error: "Row not found" });
            return;
        }
        const pallet = await Pallet.create({
            title,
            rowId,
            poses,
            sector,
        });
        rowDoc.pallets.push(pallet._id);
        await rowDoc.save();
        res.status(201).json(pallet);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to create pallet", details: error });
    }
};

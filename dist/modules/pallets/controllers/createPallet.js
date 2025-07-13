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
    const session = await mongoose.startSession();
    try {
        await session.withTransaction(async () => {
            const rowDoc = await Row.findById(rowId).session(session);
            if (!rowDoc) {
                res.status(404).json({ error: "Row not found" });
                throw new Error("Row not found");
            }
            const [createdPallet] = await Pallet.create([
                {
                    title,
                    row: {
                        _id: rowDoc._id,
                        title: rowDoc.title,
                    },
                    poses,
                    sector,
                },
            ], { session });
            rowDoc.pallets.push(createdPallet._id);
            await rowDoc.save({ session });
            res.status(201).json(createdPallet);
        });
    }
    catch (error) {
        if (!res.headersSent) {
            res
                .status(500)
                .json({ error: "Failed to create pallet", details: error });
        }
    }
    finally {
        await session.endSession();
    }
};

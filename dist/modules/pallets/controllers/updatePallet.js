import mongoose, { Types } from "mongoose";
import { z } from "zod";
import { Row } from "../../rows/models/Row.js";
import { Pallet } from "../models/Pallet.js";
const updatePalletSchema = z.object({
    title: z.string().min(1).optional(),
    rowId: z
        .string()
        .refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid rowId",
    })
        .optional(),
    poses: z
        .array(z.string().refine((val) => mongoose.Types.ObjectId.isValid(val)))
        .optional(),
    sector: z.string().optional(),
});
export const updatePallet = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({ error: "Invalid pallet ID" });
        return;
    }
    const parseResult = updatePalletSchema.safeParse(req.body);
    if (!parseResult.success) {
        res.status(400).json({ error: parseResult.error.errors });
        return;
    }
    // Start a mongoose session for transaction safety
    const session = await mongoose.startSession();
    try {
        // Start transaction
        await session.withTransaction(async () => {
            const pallet = await Pallet.findById(id).session(session);
            if (!pallet) {
                throw new Error("Pallet not found");
            }
            // If row is being changed, update both old and new row's pallets arrays
            if (parseResult.data.rowId &&
                pallet.rowId &&
                parseResult.data.rowId !== pallet.rowId.toString()) {
                const oldRow = await Row.findById(pallet.rowId).session(session);
                const newRow = await Row.findById(parseResult.data.rowId).session(session);
                if (!newRow) {
                    throw new Error("New rowId not found");
                }
                if (oldRow) {
                    oldRow.pallets = oldRow.pallets.filter((pid) => pid.toString() !== id);
                    await oldRow.save({ session });
                }
                newRow.pallets.push(pallet._id);
                await newRow.save({ session });
                pallet.set("rowId", new Types.ObjectId(parseResult.data.rowId));
            }
            // Update pallet fields
            if (parseResult.data.title !== undefined) {
                pallet.title = parseResult.data.title;
            }
            if (parseResult.data.poses !== undefined) {
                pallet.set("poses", parseResult.data.poses.map((p) => new Types.ObjectId(p)));
            }
            if (parseResult.data.sector !== undefined) {
                pallet.sector = parseResult.data.sector;
            }
            await pallet.save({ session });
            // Return the updated pallet
            res.json(pallet);
        });
    }
    catch (error) {
        // Handle specific error types
        if (error instanceof Error) {
            if (error.message === "Pallet not found") {
                res.status(404).json({ error: "Pallet not found" });
                return;
            }
            if (error.message === "New rowId not found") {
                res.status(404).json({ error: "New rowId not found" });
                return;
            }
        }
        res.status(500).json({ error: "Failed to update pallet", details: error });
    }
    finally {
        // Always end the session
        await session.endSession();
    }
};

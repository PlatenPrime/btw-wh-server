import mongoose from "mongoose";
import { z } from "zod";
import { Pos } from "../../poses/models/Pos.js";
import { Row } from "../../rows/models/Row.js";
import { Pallet } from "../models/Pallet.js";
const movePalletPosesSchema = z.object({
    sourcePalletId: z
        .string()
        .refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid sourcePalletId",
    }),
    targetPalletId: z
        .string()
        .refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid targetPalletId",
    }),
});
export const movePalletPoses = async (req, res) => {
    const parseResult = movePalletPosesSchema.safeParse(req.body);
    if (!parseResult.success) {
        res.status(400).json({ error: parseResult.error.errors });
        return;
    }
    const { sourcePalletId, targetPalletId } = parseResult.data;
    // Validate before starting transaction
    if (sourcePalletId === targetPalletId) {
        res
            .status(400)
            .json({ error: "Source and target pallet IDs must be different" });
        return;
    }
    const session = await mongoose.startSession();
    try {
        await session.withTransaction(async () => {
            const [sourcePallet, targetPallet] = await Promise.all([
                Pallet.findById(sourcePalletId).session(session),
                Pallet.findById(targetPalletId).session(session),
            ]);
            if (!sourcePallet || !targetPallet) {
                res.status(404).json({ error: "Source or target pallet not found" });
                throw new Error("Source or target pallet not found");
            }
            if (!Array.isArray(targetPallet.poses) || targetPallet.poses.length > 0) {
                res.status(400).json({ error: "Target pallet must be empty" });
                throw new Error("Target pallet must be empty");
            }
            if (!Array.isArray(sourcePallet.poses) ||
                sourcePallet.poses.length === 0) {
                res.status(400).json({ error: "Source pallet has no poses to move" });
                throw new Error("Source pallet has no poses to move");
            }
            // Получаем информацию о ряде для target pallet
            const targetRow = await Row.findById(targetPallet.row._id).session(session);
            if (!targetRow) {
                res.status(404).json({ error: "Target row not found" });
                throw new Error("Target row not found");
            }
            // Move poses
            const posesToMove = (await Pos.find({
                _id: { $in: sourcePallet.poses },
            }).session(session));
            for (const pos of posesToMove) {
                pos.pallet = {
                    _id: targetPallet._id,
                    title: targetPallet.title,
                    sector: targetPallet.sector,
                };
                pos.row = {
                    _id: targetRow._id,
                    title: targetRow.title,
                };
                pos.palletTitle = targetPallet.title;
                pos.rowTitle = targetRow.title;
                await pos.save({ session });
            }
            // Update pallets
            targetPallet.poses = sourcePallet.poses;
            sourcePallet.poses = [];
            await Promise.all([
                targetPallet.save({ session }),
                sourcePallet.save({ session }),
            ]);
            res.json({ message: "Poses moved successfully", targetPallet });
        });
    }
    catch (error) {
        if (!res.headersSent) {
            res.status(500).json({ error: "Failed to move poses", details: error });
        }
    }
    finally {
        await session.endSession();
    }
};

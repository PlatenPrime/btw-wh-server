import { Request, Response } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { IPos, Pos } from "../../poses/models/Pos.js";
import { IPallet, Pallet } from "../models/Pallet.js";

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

export const movePalletPoses = async (req: Request, res: Response) => {
  const parseResult = movePalletPosesSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({ error: parseResult.error.errors });
    return;
  }
  const { sourcePalletId, targetPalletId } = parseResult.data;
  if (sourcePalletId === targetPalletId) {
    res
      .status(400)
      .json({ error: "Source and target pallet IDs must be different" });
    return;
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const [sourcePallet, targetPallet] = await Promise.all([
      Pallet.findById(sourcePalletId).session(
        session
      ) as Promise<IPallet | null>,
      Pallet.findById(targetPalletId).session(
        session
      ) as Promise<IPallet | null>,
    ]);
    if (!sourcePallet || !targetPallet) {
      await session.abortTransaction();
      res.status(404).json({ error: "Source or target pallet not found" });
      return;
    }
    if (!Array.isArray(targetPallet.poses) || targetPallet.poses.length > 0) {
      await session.abortTransaction();
      res.status(400).json({ error: "Target pallet must be empty" });
      return;
    }
    if (!Array.isArray(sourcePallet.poses) || sourcePallet.poses.length === 0) {
      await session.abortTransaction();
      res.status(400).json({ error: "Source pallet has no poses to move" });
      return;
    }

    // Move poses
    const posesToMove = (await Pos.find({
      _id: { $in: sourcePallet.poses },
    }).session(session)) as IPos[];
    for (const pos of posesToMove) {
      pos.palletId = targetPallet._id as mongoose.Types.ObjectId;
      pos.rowId = targetPallet.rowId as mongoose.Types.ObjectId;
      pos.palletTitle = targetPallet.title;
      // Optionally update rowTitle if needed (not always present)
      if (targetPallet.rowId && pos.rowTitle !== undefined) {
        pos.rowTitle = undefined; // Or fetch and set the new row title if required
      }
      await pos.save({ session });
    }

    // Update pallets
    targetPallet.poses = sourcePallet.poses;
    sourcePallet.poses = [];
    await Promise.all([
      targetPallet.save({ session }),
      sourcePallet.save({ session }),
    ]);

    await session.commitTransaction();
    res.json({ message: "Poses moved successfully", targetPallet });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ error: "Failed to move poses", details: error });
  } finally {
    session.endSession();
  }
};

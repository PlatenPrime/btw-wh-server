import { Request, Response } from "express";
import mongoose from "mongoose";
import { Pos } from "../../poses/models/Pos.js";
import { Pallet } from "../models/Pallet.js";

export const deletePalletPoses = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ error: "Invalid pallet ID" });
    return;
  }

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const pallet = await Pallet.findById(id).session(session);
      if (!pallet) {
        throw new Error("Pallet not found");
      }

      const posesCount = pallet.poses?.length || 0;

      // Remove all positions associated with this pallet
      if (pallet.poses && pallet.poses.length > 0) {
        await Pos.deleteMany({ _id: { $in: pallet.poses } }).session(session);

        // Clear the poses array from the pallet
        pallet.poses = [];
        await pallet.save({ session });
      }

      res.json({
        message: "Pallet content removed successfully",
        removedPosesCount: posesCount,
      });
    });
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({
        error: "Failed to remove pallet content",
        details: error instanceof Error ? error.message : error,
      });
    }
  } finally {
    await session.endSession();
  }
};

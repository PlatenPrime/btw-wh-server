import { Request, Response } from "express";
import mongoose from "mongoose";
import { Pallet } from "../../pallets/models/Pallet.js";
import { IPos, Pos } from "../models/Pos.js";

export const deletePos = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ error: "Invalid position ID" });
    return;
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const pos: IPos | null = await Pos.findById(id).session(session);
      if (!pos) {
        res.status(404).json({ error: "Position not found" });
        throw new Error("Position not found");
      }

      // Удаляем позицию из паллета
      const pallet = await Pallet.findById(pos.palletId).session(session);
      if (pallet) {
        pallet.poses = pallet.poses.filter(
          (posId: any) => posId.toString() !== id
        );
        await pallet.save({ session });
      }

      // Удаляем позицию
      await Pos.findByIdAndDelete(id).session(session);

      res.json({ message: "Position deleted successfully" });
    });
  } catch (error) {
    if (!res.headersSent) {
      res
        .status(500)
        .json({ error: "Failed to delete position", details: error });
    }
  } finally {
    await session.endSession();
  }
};

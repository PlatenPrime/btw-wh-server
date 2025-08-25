import { Request, Response } from "express";
import { Pos } from "../../poses/models/Pos.js";
import { Pallet } from "../models/Pallet.js";

export const deletePalletPoses = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ message: "id is required" });
  }
  const session = await Pallet.startSession();
  try {
    await session.withTransaction(async () => {
      try {
        const pallet = await Pallet.findById(id).session(session);
        if (!pallet) {
          return res.status(404).json({ message: "Pallet not found" });
        }

        if (pallet.poses && pallet.poses.length > 0) {
          await Pos.deleteMany({ _id: { $in: pallet.poses } }).session(session);
           pallet.poses = [];
        }

        await pallet.save({ session });
        return res.status(200).json({
          message: "Pallet poses removed successfully",
        });
      } catch (err: any) {
        if (err.name === "ValidationError" || err.name === "CastError") {
          return res.status(400).json({ message: err.message, error: err });
        }
        return res.status(500).json({ message: "Server error", error: err });
      }
    });
  } catch (error: any) {
    return res.status(500).json({ message: "Server error", error });
  } finally {
    await session.endSession();
  }
};

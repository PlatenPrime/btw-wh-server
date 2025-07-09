import { Request, Response } from "express";
import mongoose from "mongoose";
import { Pos } from "../../poses/models/Pos.js";
import { Row } from "../../rows/models/Row.js";
import { Pallet } from "../models/Pallet.js";

export const deletePallet = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ error: "Invalid pallet ID" });
    return;
  }
  try {
    const pallet = await Pallet.findById(id);
    if (!pallet) {
      res.status(404).json({ error: "Pallet not found" });
      return;
    }
    // Remove all positions associated with this pallet
    if (pallet.poses && pallet.poses.length > 0) {
      await Pos.deleteMany({ _id: { $in: pallet.poses } });
    }
    // Remove pallet reference from the row
    const row = await Row.findById(pallet.rowId);
    if (row) {
      row.pallets = row.pallets.filter((pid: any) => pid.toString() !== id);
      await row.save();
    }
    await Pallet.findByIdAndDelete(id);
    res.json({ message: "Pallet deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete pallet", details: error });
  }
};

import { Request, Response } from "express";
import mongoose from "mongoose";
import { IPos, Pos } from "../models/Pos.js";

export const getPosesByPalletId = async (req: Request, res: Response) => {
  const { palletId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(palletId)) {
    res.status(400).json({ error: "Invalid pallet ID" });
    return;
  }

  try {
    const poses: IPos[] = await Pos.find({ palletId })
      .populate("palletId", "title sector")
      .populate("rowId", "title")
      .sort({ createdAt: -1 });

    res.json(poses);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch poses by pallet", details: error });
  }
};

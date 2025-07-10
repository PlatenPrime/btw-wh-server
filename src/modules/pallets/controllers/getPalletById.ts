import { Request, Response } from "express";
import mongoose from "mongoose";
import { IPallet, Pallet } from "../models/Pallet.js";

export const getPalletById = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ error: "Invalid pallet ID" });
    return;
  }
  try {
    const pallet: IPallet | null = await Pallet.findById(id)
      .populate("row")
      .populate("poses");
    if (!pallet) {
      res.status(404).json({ error: "Pallet not found" });
      return;
    }
    res.json(pallet);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch pallet", details: error });
  }
};

import { Request, Response } from "express";
import { IPallet, Pallet } from "../models/Pallet.js";

export const getAllPallets = async (req: Request, res: Response) => {
  try {
    const pallets: IPallet[] = await Pallet.find();
    if (!pallets || pallets.length === 0) {
      return res.status(404).json({ message: "Pallets not found" });
    }
    return res.status(200).json(pallets);
  } catch (error) {
    return res
      .status(500)
      .json({
        message: "Server error",
        error: error instanceof Error ? error.message : error,
      });
  }
};

import { Request, Response } from "express";
import { IPallet, Pallet } from "../models/Pallet.js";

export const getAllPallets = async (req: Request, res: Response) => {
  try {
    const pallets: IPallet[] = await Pallet.find();
    res.json(pallets);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch pallets", details: error });
  }
};

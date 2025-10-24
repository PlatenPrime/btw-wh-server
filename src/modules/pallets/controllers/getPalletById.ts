import { Request, Response } from "express";
import mongoose from "mongoose";
import { IPallet, Pallet } from "../models/Pallet.js";

export const getPalletById = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(500).json({ message: "Server error" });
  }
  try {
    const pallet: IPallet | null = await Pallet.findById(id).populate({
      path: "poses",
      options: { sort: { artikul: 1 } }, // Сортировка по artikul в алфавитном порядке
    });
    if (!pallet) {
      return res.status(200).json({
        exists: false,
        message: "Pallet not found",
        data: null,
      });
    }
    const palletObj = pallet.toObject() as IPallet;

    return res.status(200).json({
      exists: true,
      message: "Pallet retrieved successfully",
      data: palletObj,
    });
  } catch (error: any) {
    console.error("getPalletById error:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};

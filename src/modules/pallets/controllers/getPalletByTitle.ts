import { Request, Response } from "express";
import { IPallet, Pallet } from "../models/Pallet.js";

export const getPalletByTitle = async (req: Request, res: Response) => {
  const { title } = req.params;

  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return res.status(400).json({ message: "Invalid title parameter" });
  }

  try {
    const pallet: IPallet | null = await Pallet.findOne({
      title: title.trim(),
    }).populate({
      path: "poses",
      options: { sort: { artikul: 1 } }, // Сортировка по artikul в алфавитном порядке
    });

    if (!pallet) {
      return res.status(404).json({ message: "Pallet not found" });
    }

    const palletObj = pallet.toObject() as IPallet;

    return res.status(200).json(palletObj);
  } catch (error: any) {
    console.error("getPalletByTitle error:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};

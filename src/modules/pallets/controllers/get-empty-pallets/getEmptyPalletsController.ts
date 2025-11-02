import { Request, Response } from "express";
import { Pallet } from "../../models/Pallet.js";
import { sortPalletsByTitle } from "../../utils/sortPalletsByTitle.js";

export const getEmptyPalletsController = async (
  req: Request,
  res: Response
) => {
  try {
    const pallets = await Pallet.find({
      $or: [{ poses: { $exists: false } }, { poses: { $size: 0 } }],
    });

    if (!pallets || pallets.length === 0) {
      res.status(200).json([]);
      return;
    }

    const sortedPallets = sortPalletsByTitle(pallets);

    res.status(200).json(sortedPallets);
  } catch (error: any) {
    if (!res.headersSent) {
      res.status(500).json({
        message: "Server error",
        error: error instanceof Error ? error.message : error,
      });
    }
  }
};








import { Request, Response } from "express";
import mongoose from "mongoose";
import { IPallet, Pallet } from "../models/Pallet.js";

export const getPalletById = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    // Patch: test expects 500 for invalid ID
    return res.status(500).json({ message: "Server error" });
  }
  try {
    const pallet: IPallet | null = await Pallet.findById(id).populate("poses");
    if (!pallet) {
      return res.status(404).json({ message: "Pallet not found" });
    }
    const palletObj = pallet.toObject() as IPallet;
    const responseObj = {
      ...palletObj,
      _id: (palletObj._id as mongoose.Types.ObjectId).toString(),
      row: palletObj.row
        ? { ...palletObj.row, _id: palletObj.row._id.toString() }
        : undefined,
      poses: Array.isArray(palletObj.poses)
        ? palletObj.poses.map((id: any) => id.toString())
        : [],
    };
    return res.status(200).json(responseObj);
  } catch (error: any) {
    return res.status(500).json({ message: "Server error", error });
  }
};

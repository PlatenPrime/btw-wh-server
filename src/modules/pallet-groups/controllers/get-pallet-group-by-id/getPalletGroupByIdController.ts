import { Request, Response } from "express";
import mongoose from "mongoose";
import { PalletGroup } from "../../models/PalletGroup.js";
import { getPalletsShortForGroup } from "../../utils/getGroupPalletsShortDtoUtil.js";

export const getPalletGroupByIdController = async (
  req: Request,
  res: Response,
) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid pallet group id" });
  }

  try {
    const group = await PalletGroup.findById(id).exec();

    if (!group) {
      return res.status(404).json({ message: "Pallet group not found" });
    }

    const pallets = await getPalletsShortForGroup(group);

    return res.status(200).json({
      message: "Pallet group fetched successfully",
      data: {
        id: group._id.toString(),
        title: group.title,
        order: group.order,
        pallets,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.message || "Failed to fetch pallet group",
    });
  }
};

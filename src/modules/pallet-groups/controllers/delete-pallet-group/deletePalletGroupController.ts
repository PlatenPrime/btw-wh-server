import { Request, Response } from "express";
import mongoose from "mongoose";
import { Pallet } from "../../../pallets/models/Pallet.js";
import { PalletGroup } from "../../models/PalletGroup.js";

export const deletePalletGroupController = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid pallet group id" });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const group = await PalletGroup.findById(id).session(session);

    if (!group) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Pallet group not found" });
    }

    const palletIds = group.pallets;

    if (palletIds.length > 0) {
      await Pallet.updateMany(
        { _id: { $in: palletIds } },
        {
          $set: { sector: 0 },
          $unset: { palgr: "" },
        },
        { session }
      );
    }

    await group.deleteOne({ session });

    const remainingGroups = await PalletGroup.find({})
      .sort({ order: 1 })
      .session(session);

    for (let index = 0; index < remainingGroups.length; index += 1) {
      const g = remainingGroups[index];
      g.order = index + 1;
      await g.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      message: "Pallet group deleted successfully",
    });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();

    return res.status(500).json({
      message: error.message || "Failed to delete pallet group",
    });
  }
};


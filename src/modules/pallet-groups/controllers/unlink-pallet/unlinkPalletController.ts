import { Request, Response } from "express";
import mongoose from "mongoose";
import { getPalletsShortForGroup } from "../../utils/getGroupPalletsShortDtoUtil.js";
import { unlinkPalletSchema } from "./schemas/unlinkPalletSchema.js";
import { unlinkPalletUtil } from "./utils/unlinkPalletUtil.js";

export const unlinkPalletController = async (req: Request, res: Response) => {
  const body = {
    palletId: req.body.palletId ?? req.params.palletId,
  };

  const parseResult = unlinkPalletSchema.safeParse(body);

  if (!parseResult.success) {
    return res
      .status(400)
      .json({ message: "Invalid data", errors: parseResult.error.errors });
  }

  const { palletId } = parseResult.data;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const group = await unlinkPalletUtil({
      palletId,
      session,
    });

    await session.commitTransaction();
    session.endSession();

    if (!group) {
      return res.status(404).json({
        message: "Pallet is not linked to any group",
      });
    }

    const pallets = await getPalletsShortForGroup(group);

    return res.status(200).json({
      message: "Pallet unlinked from group successfully",
      data: {
        id: group._id.toString(),
        title: group.title,
        order: group.order,
        pallets,
      },
    });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();

    return res.status(400).json({
      message: error.message || "Failed to unlink pallet from group",
    });
  }
};

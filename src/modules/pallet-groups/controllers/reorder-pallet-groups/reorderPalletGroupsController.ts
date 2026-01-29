import { Request, Response } from "express";
import mongoose from "mongoose";
import { reorderPalletGroupsSchema } from "./schemas/reorderPalletGroupsSchema.js";
import { reorderPalletGroupsUtil } from "./utils/reorderPalletGroupsUtil.js";

export const reorderPalletGroupsController = async (
  req: Request,
  res: Response,
) => {
  const parseResult = reorderPalletGroupsSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res
      .status(400)
      .json({ message: "Invalid data", errors: parseResult.error.errors });
  }

  const { orders } = parseResult.data;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { updatedCount } = await reorderPalletGroupsUtil({
      orders,
      session,
    });

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      message: "Pallet groups order updated successfully",
      data: { updatedCount },
    });
  } catch (error: unknown) {
    await session.abortTransaction();
    session.endSession();

    const message =
      error instanceof Error
        ? error.message
        : "Failed to reorder pallet groups";

    return res.status(400).json({
      message,
    });
  }
};

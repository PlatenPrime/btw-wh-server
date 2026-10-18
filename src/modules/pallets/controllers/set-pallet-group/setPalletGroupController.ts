import { Request, Response } from "express";
import mongoose from "mongoose";
import { createEventUtil } from "../../../events/utils/createEventUtil.js";
import { calculatePalletsSectorsUtil } from "../../../pallet-groups/utils/calculatePalletsSectorsUtil.js";
import { Pallet } from "../../models/Pallet.js";
import { setPalletGroupSchema } from "./schemas/setPalletGroupSchema.js";
import { setPalletGroupUtil } from "./utils/setPalletGroupUtil.js";

export const setPalletGroupController = async (req: Request, res: Response) => {
  const parseResult = setPalletGroupSchema.safeParse({
    id: req.params.id,
    groupId: req.body?.groupId,
  });

  if (!parseResult.success) {
    return res.status(400).json({
      message: "Invalid data",
      errors: parseResult.error.issues,
    });
  }

  const { id: palletId, groupId } = parseResult.data;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const result = await setPalletGroupUtil({
      palletId,
      groupId,
      session,
    });

    await session.commitTransaction();
    session.endSession();

    const groupIds = [result.targetGroupId];
    if (result.previousGroupId && !result.previousGroupId.equals(result.targetGroupId)) {
      groupIds.push(result.previousGroupId);
    }

    if (!result.alreadyInGroup) {
      await calculatePalletsSectorsUtil({ groupIds });
    }

    const updatedPallet = await Pallet.findById(palletId).exec();

    if (req.user?.id && !result.alreadyInGroup) {
      await createEventUtil({
        userId: req.user.id,
        department: "pallets",
        type: "edit",
        description: `Змінено паллетну групу паллети ${updatedPallet?.title ?? palletId} → groupId ${groupId}`,
      });
    }

    return res.status(200).json({
      message: result.alreadyInGroup
        ? "Pallet already belongs to this group"
        : "Pallet group updated successfully",
      data: updatedPallet,
    });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();

    const message = error?.message || "Failed to set pallet group";

    if (message === "Pallet not found") {
      return res.status(404).json({ message });
    }
    if (message === "Pallet group not found") {
      return res.status(404).json({ message });
    }

    return res.status(400).json({ message });
  }
};

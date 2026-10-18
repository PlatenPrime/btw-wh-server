import mongoose, { ClientSession, Types } from "mongoose";
import { PalletGroup } from "../../../../pallet-groups/models/PalletGroup.js";
import { IPallet, Pallet } from "../../../models/Pallet.js";

type SetPalletGroupUtilInput = {
  palletId: string;
  groupId: string;
  session: ClientSession;
};

export type SetPalletGroupUtilResult = {
  pallet: IPallet;
  targetGroupId: Types.ObjectId;
  previousGroupId: Types.ObjectId | null;
  alreadyInGroup: boolean;
};

/**
 * Moves pallet membership to target group (append at end).
 * Unlinks from previous group if any. Does not recalculate sectors.
 */
export const setPalletGroupUtil = async ({
  palletId,
  groupId,
  session,
}: SetPalletGroupUtilInput): Promise<SetPalletGroupUtilResult> => {
  const palletObjectId = new mongoose.Types.ObjectId(palletId);
  const groupObjectId = new mongoose.Types.ObjectId(groupId);

  const pallet = await Pallet.findById(palletObjectId).session(session);
  if (!pallet) {
    throw new Error("Pallet not found");
  }

  const targetGroup = await PalletGroup.findById(groupObjectId).session(session);
  if (!targetGroup) {
    throw new Error("Pallet group not found");
  }

  const alreadyInTarget = targetGroup.pallets.some((id) => id.equals(palletObjectId));
  if (alreadyInTarget) {
    return {
      pallet,
      targetGroupId: targetGroup._id,
      previousGroupId: targetGroup._id,
      alreadyInGroup: true,
    };
  }

  const previousGroup = await PalletGroup.findOne({
    pallets: palletObjectId,
  }).session(session);

  let previousGroupId: Types.ObjectId | null = null;

  if (previousGroup) {
    previousGroupId = previousGroup._id;
    previousGroup.pallets = previousGroup.pallets.filter((id) => !id.equals(palletObjectId));
    await previousGroup.save({ session });
  }

  targetGroup.pallets.push(palletObjectId);
  await targetGroup.save({ session });

  return {
    pallet,
    targetGroupId: targetGroup._id,
    previousGroupId,
    alreadyInGroup: false,
  };
};

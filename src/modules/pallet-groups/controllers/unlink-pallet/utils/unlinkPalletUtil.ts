import mongoose, { ClientSession } from "mongoose";
import {
  IPalletGroup,
  PalletGroup,
} from "../../../models/PalletGroup.js";
import { calculatePalletsSectorsUtil } from "../../../utils/calculatePalletsSectorsUtil.js";
import { Pallet } from "../../../../pallets/models/Pallet.js";

type UnlinkPalletUtilInput = {
  palletId: string;
  session: ClientSession;
};

export const unlinkPalletUtil = async ({
  palletId,
  session,
}: UnlinkPalletUtilInput): Promise<IPalletGroup | null> => {
  const palletObjectId = new mongoose.Types.ObjectId(palletId);

  const group = await PalletGroup.findOne({
    pallets: palletObjectId,
  }).session(session);

  if (!group) {
    return null;
  }

  group.pallets = group.pallets.filter((id) => !id.equals(palletObjectId));
  await group.save({ session });

  await Pallet.updateOne(
    { _id: palletObjectId },
    {
      $set: { sector: 0 },
      $unset: { palgr: "" },
    },
    { session },
  );

  await calculatePalletsSectorsUtil({
    groupIds: [group._id],
  });

  return group;
};

import { ClientSession } from "mongoose";
import { Pos } from "../../../../poses/models/Pos.js";

type UpdatePosesPalletDataInput = {
  palletId: string;
  title?: string;
  sector?: string;
  isDef?: boolean;
  session: ClientSession;
};

export const updatePosesPalletDataUtil = async ({
  palletId,
  title,
  sector,
  isDef,
  session,
}: UpdatePosesPalletDataInput): Promise<void> => {
  const updateFields: any = {};

  if (title !== undefined) {
    updateFields["palletData.title"] = title;
    updateFields.palletTitle = title;
  }

  if (sector !== undefined) {
    updateFields["palletData.sector"] = sector;
  }

  if (isDef !== undefined) {
    updateFields["palletData.isDef"] = isDef;
  }

  if (Object.keys(updateFields).length > 0) {
    await Pos.updateMany({ pallet: palletId }, { $set: updateFields }).session(
      session
    );
  }
};









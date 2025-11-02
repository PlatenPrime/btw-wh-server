import { Types } from "mongoose";
import { ClientSession } from "mongoose";
import { Pos } from "../../../../poses/models/Pos.js";
import { IRow, Row } from "../../../../rows/models/Row.js";
import { IPallet, Pallet } from "../../../models/Pallet.js";

type DeletePalletInput = {
  palletId: string;
  session: ClientSession;
};

export const deletePalletUtil = async ({
  palletId,
  session,
}: DeletePalletInput): Promise<void> => {
  const pallet = await Pallet.findById(palletId).session(session);
  if (!pallet) {
    throw new Error("Pallet not found");
  }

  // Удаление связанных poses
  if (pallet.poses && pallet.poses.length > 0) {
    await Pos.deleteMany({ _id: { $in: pallet.poses } }).session(session);
  }

  // Обновление Row - удаление ссылки на паллету
  const row = await Row.findById(pallet.row._id).session(session);
  if (row) {
    row.pallets = row.pallets.filter(
      (pid) => pid.toString() !== palletId
    ) as Types.ObjectId[];
    await row.save({ session });
  }

  // Удаление паллеты
  await Pallet.findByIdAndDelete(palletId).session(session);
};







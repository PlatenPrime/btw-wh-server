import mongoose from "mongoose";
import { ClientSession } from "mongoose";
import { IRow } from "../../../../rows/models/Row.js";
import { IPallet, Pallet } from "../../../models/Pallet.js";
import { serializeIds } from "../../../utils/serialize-ids.js";

type UpdatePalletInput = {
  palletId: string;
  title?: string;
  rowId?: string;
  poses?: string[];
  sector?: string;
  isDef?: boolean;
  rowDoc?: IRow;
  session: ClientSession;
};

export const updatePalletUtil = async ({
  palletId,
  title,
  rowId,
  poses,
  sector,
  isDef,
  rowDoc,
  session,
}: UpdatePalletInput): Promise<any> => {
  const pallet = await Pallet.findById(palletId).session(session);
  if (!pallet) {
    throw new Error("Pallet not found");
  }

  if (title !== undefined) {
    pallet.title = title;
  }

  if (sector !== undefined) {
    pallet.sector = sector;
  }

  if (poses !== undefined) {
    pallet.poses = poses.map((id) => new mongoose.Types.ObjectId(id));
  }

  if (rowId !== undefined && rowDoc) {
    pallet.row = rowDoc._id;
    pallet.rowData = { _id: rowDoc._id, title: rowDoc.title };
  }

  if (isDef !== undefined) {
    pallet.isDef = isDef;
  }

  await pallet.save({ session });

  return serializeIds(pallet.toObject());
};







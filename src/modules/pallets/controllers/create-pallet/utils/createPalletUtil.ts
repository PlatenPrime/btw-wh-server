import { Types } from "mongoose";
import { ClientSession } from "mongoose";
import { IRow } from "../../../../rows/models/Row.js";
import { IPallet, Pallet } from "../../../models/Pallet.js";
import { serializeIds } from "../../../utils/serialize-ids.js";

type CreatePalletInput = {
  title: string;
  rowId: string;
  sector?: string;
  isDef?: boolean;
  rowData: IRow;
  session: ClientSession;
};

export const createPalletUtil = async ({
  title,
  rowId,
  sector,
  isDef,
  rowData,
  session,
}: CreatePalletInput): Promise<any> => {
  const created = await Pallet.create(
    [
      {
        title,
        row: rowData._id,
        rowData: { _id: rowData._id, title: rowData.title },
        poses: [],
        sector,
        isDef,
      },
    ],
    { session }
  );

  if (!created || !created[0]) {
    throw new Error("Failed to create pallet");
  }

  rowData.pallets.push(created[0]._id as Types.ObjectId);
  await rowData.save({ session });

  return serializeIds(created[0].toObject());
};









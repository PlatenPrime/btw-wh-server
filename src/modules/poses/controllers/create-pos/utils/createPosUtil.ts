import mongoose, { ClientSession } from "mongoose";
import { IPallet } from "../../../../pallets/models/Pallet.js";
import { IRow } from "../../../../rows/models/Row.js";
import { IPos, Pos } from "../../../models/Pos.js";
import { CreatePosInput } from "../schemas/createPosSchema.js";
import { getPalletDataUtil } from "./getPalletDataUtil.js";
import { getRowDataUtil } from "./getRowDataUtil.js";

type CreatePosUtilInput = Omit<CreatePosInput, "palletId" | "rowId"> & {
  pallet: IPallet;
  row: IRow;
  session: ClientSession;
};

/**
 * Создаёт позицию с subdocuments для palletData и rowData
 */
export const createPosUtil = async ({
  pallet,
  row,
  artikul,
  nameukr,
  quant,
  boxes,
  date,
  sklad,
  comment,
  session,
}: CreatePosUtilInput): Promise<IPos> => {
  const palletData = getPalletDataUtil(pallet);
  const rowData = getRowDataUtil(row);

  const [createdPos] = await Pos.create(
    [
      {
        pallet: pallet._id,
        row: row._id,
        palletTitle: pallet.title,
        rowTitle: row.title,
        palletData,
        rowData,
        artikul,
        nameukr,
        quant,
        boxes,
        date,
        sklad,
        comment,
      },
    ],
    { session }
  );

  return createdPos as IPos;
};


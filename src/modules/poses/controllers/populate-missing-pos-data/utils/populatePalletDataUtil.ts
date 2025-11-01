import { Types } from "mongoose";
import { IPallet } from "../../../../pallets/models/Pallet.js";
import { IPos } from "../../../models/Pos.js";
import { Pallet } from "../../../../pallets/models/Pallet.js";

/**
 * Заполняет palletData для позиции из паллета
 */
export const populatePalletDataUtil = async (
  pos: IPos
): Promise<IPallet> => {
  const pallet = await Pallet.findById(pos.pallet);
  if (!pallet) {
    throw new Error("Pallet not found");
  }

  pos.palletData = {
    _id: pallet._id as Types.ObjectId,
    title: pallet.title,
    sector: pallet.sector,
    isDef: pallet.isDef,
  };

  return pallet;
};


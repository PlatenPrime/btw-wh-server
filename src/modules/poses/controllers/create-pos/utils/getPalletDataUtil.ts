import mongoose from "mongoose";
import { IPallet } from "../../../../pallets/models/Pallet.js";

/**
 * Формирует palletData subdocument для позиции из объекта паллета
 */
export const getPalletDataUtil = (pallet: IPallet) => {
  return {
    _id: pallet._id as mongoose.Types.ObjectId,
    title: pallet.title,
    sector: pallet.sector,
    isDef: pallet.isDef,
  };
};


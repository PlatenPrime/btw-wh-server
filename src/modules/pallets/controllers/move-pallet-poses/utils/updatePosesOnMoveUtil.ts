import mongoose from "mongoose";
import { ClientSession } from "mongoose";
import { IPos, Pos } from "../../../../poses/models/Pos.js";
import { IPallet } from "../../../models/Pallet.js";
import { IRow } from "../../../../rows/models/Row.js";
import { serializeIds } from "../../../utils/serialize-ids.js";

type UpdatePosesOnMoveInput = {
  posesToMove: IPos[];
  targetPallet: IPallet;
  targetRow: IRow;
  session: ClientSession;
};

export const updatePosesOnMoveUtil = async ({
  posesToMove,
  targetPallet,
  targetRow,
  session,
}: UpdatePosesOnMoveInput): Promise<void> => {
  for (const pos of posesToMove) {
    // Обновление данных паллеты
    pos.palletData = {
      _id: targetPallet._id as mongoose.Types.ObjectId,
      title: targetPallet.title,
      sector: targetPallet.sector,
      isDef: targetPallet.isDef,
    };

    // Обновление данных ряда
    pos.rowData = {
      _id: targetRow._id as mongoose.Types.ObjectId,
      title: targetRow.title,
    };

    // Обновление кэшированных полей
    pos.palletTitle = targetPallet.title;
    pos.rowTitle = targetRow.title;

    // Обновление для обратной совместимости
    pos.pallet = targetPallet._id as mongoose.Types.ObjectId;
    pos.row = targetRow._id as mongoose.Types.ObjectId;

    await pos.save({ session });
  }
};








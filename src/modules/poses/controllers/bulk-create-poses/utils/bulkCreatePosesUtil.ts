import mongoose, { ClientSession } from "mongoose";
import { IPallet } from "../../../../pallets/models/Pallet.js";
import { IRow } from "../../../../rows/models/Row.js";
import { IPos } from "../../../models/Pos.js";
import { CreatePosInput } from "../../create-pos/schemas/createPosSchema.js";
import { createPosUtil } from "../../create-pos/utils/createPosUtil.js";
import { validatePalletsAndRowsUtil } from "./validatePalletsAndRowsUtil.js";

type BulkCreatePosesInput = {
  poses: CreatePosInput[];
  session: ClientSession;
};

/**
 * Массово создаёт позиции и обновляет связанные паллеты
 */
export const bulkCreatePosesUtil = async ({
  poses,
  session,
}: BulkCreatePosesInput): Promise<IPos[]> => {
  // Валидация паллетов и рядов
  const { pallets, rows } = await validatePalletsAndRowsUtil({ poses, session });

  const createdPoses: IPos[] = [];
  const palletUpdates = new Map<string, mongoose.Types.ObjectId[]>();

  // Создаём позиции
  for (const posData of poses) {
    const pallet = pallets.find(
      (p) => (p._id as mongoose.Types.ObjectId).toString() === posData.palletId
    );
    const row = rows.find(
      (r) => (r._id as mongoose.Types.ObjectId).toString() === posData.rowId
    );

    if (!pallet || !row) {
      throw new Error("Pallet or row not found during creation");
    }

    const createdPos = await createPosUtil({
      ...posData,
      pallet,
      row,
      session,
    });

    createdPoses.push(createdPos);

    // Собираем обновления для паллетов
    if (!palletUpdates.has(posData.palletId)) {
      palletUpdates.set(posData.palletId, []);
    }
    palletUpdates
      .get(posData.palletId)!
      .push(createdPos._id as mongoose.Types.ObjectId);
  }

  // Обновляем паллеты
  for (const [palletId, posIds] of palletUpdates) {
    const pallet = pallets.find(
      (p) => (p._id as mongoose.Types.ObjectId).toString() === palletId
    );
    if (pallet) {
      pallet.poses.push(...posIds);
      await pallet.save({ session });
    }
  }

  return createdPoses;
};


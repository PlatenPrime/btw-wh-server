import mongoose, { ClientSession } from "mongoose";
import { IPallet } from "../../../../pallets/models/Pallet.js";
import { IRow } from "../../../../rows/models/Row.js";
import { Pallet } from "../../../../pallets/models/Pallet.js";
import { Row } from "../../../../rows/models/Row.js";
import { CreatePosInput } from "../../create-pos/schemas/createPosSchema.js";

type ValidatePalletsAndRowsResult = {
  pallets: IPallet[];
  rows: IRow[];
};

/**
 * Проверяет существование всех паллетов и рядов из массива позиций
 * @throws Error если какие-то паллеты или ряды не найдены
 */
export const validatePalletsAndRowsUtil = async ({
  poses,
  session,
}: {
  poses: CreatePosInput[];
  session: ClientSession;
}): Promise<ValidatePalletsAndRowsResult> => {
  const palletIds = [...new Set(poses.map((p) => p.palletId))];
  const rowIds = [...new Set(poses.map((p) => p.rowId))];

  const pallets = await Pallet.find({ _id: { $in: palletIds } }).session(
    session
  );
  const rows = await Row.find({ _id: { $in: rowIds } }).session(session);

  if (pallets.length !== palletIds.length) {
    throw new Error("Some pallets not found");
  }

  if (rows.length !== rowIds.length) {
    throw new Error("Some rows not found");
  }

  return { pallets, rows };
};


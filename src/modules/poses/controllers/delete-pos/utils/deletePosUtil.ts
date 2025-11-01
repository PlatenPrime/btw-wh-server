import mongoose, { ClientSession } from "mongoose";
import { IPos, Pos } from "../../../models/Pos.js";

type DeletePosUtilInput = {
  posId: string;
  session: ClientSession;
};

/**
 * Удаляет позицию и возвращает её данные (для удаления из паллета)
 */
export const deletePosUtil = async ({
  posId,
  session,
}: DeletePosUtilInput): Promise<IPos> => {
  const pos = await Pos.findById(posId).session(session);
  if (!pos) {
    throw new Error("Position not found");
  }

  await Pos.findByIdAndDelete(posId).session(session);
  return pos as IPos;
};


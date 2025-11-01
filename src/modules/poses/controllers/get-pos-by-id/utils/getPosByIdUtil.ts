import mongoose from "mongoose";
import { IPos, Pos } from "../../../models/Pos.js";

/**
 * Получает позицию по ID
 */
export const getPosByIdUtil = async (
  posId: string
): Promise<IPos | null> => {
  if (!mongoose.Types.ObjectId.isValid(posId)) {
    throw new Error("Invalid position ID");
  }

  const pos = await Pos.findById(posId);
  return pos as IPos | null;
};

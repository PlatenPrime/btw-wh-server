import mongoose, { ClientSession } from "mongoose";
import { IPos, Pos } from "../../../models/Pos.js";
import { UpdatePosInput } from "../schemas/updatePosSchema.js";

type UpdatePosUtilInput = {
  posId: string;
  updateData: UpdatePosInput;
  session: ClientSession;
};

/**
 * Обновляет позицию по ID
 */
export const updatePosUtil = async ({
  posId,
  updateData,
  session,
}: UpdatePosUtilInput): Promise<IPos> => {
  const updatedPos = await Pos.findByIdAndUpdate(posId, updateData, {
    new: true,
    runValidators: true,
    session,
  });

  if (!updatedPos) {
    throw new Error("Position not found");
  }

  return updatedPos as IPos;
};


import mongoose from "mongoose";
import { Block, IBlock } from "../../../models/Block.js";

type RenameBlockUtilInput = {
  id: string;
  title: string;
};

export const renameBlockUtil = async ({
  id,
  title,
}: RenameBlockUtilInput): Promise<IBlock | null> => {
  const objectId = new mongoose.Types.ObjectId(id);

  // Проверить существование блока
  const existingBlock = await Block.findById(objectId).exec();
  if (!existingBlock) {
    return null;
  }

  // Обновить только поле title
  const updatedBlock = await Block.findByIdAndUpdate(
    objectId,
    { title },
    { new: true }
  ).exec();

  if (!updatedBlock) {
    return null;
  }

  return updatedBlock;
};


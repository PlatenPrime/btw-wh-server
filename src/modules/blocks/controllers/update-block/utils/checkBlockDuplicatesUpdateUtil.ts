import { Block, IBlock } from "../../../models/Block.js";
import mongoose from "mongoose";

type CheckBlockDuplicatesUpdateInput = {
  id: string;
  title?: string;
};

export const checkBlockDuplicatesUpdateUtil = async ({
  id,
  title,
}: CheckBlockDuplicatesUpdateInput): Promise<IBlock | null> => {
  if (!title) {
    return null;
  }

  const objectId = new mongoose.Types.ObjectId(id);
  const existingBlock = await Block.findOne({
    title,
    _id: { $ne: objectId },
  }).exec();

  return existingBlock;
};


import mongoose from "mongoose";
import { Block, IBlock } from "../../../models/Block.js";

type GetBlockByIdInput = {
  id: string;
};

export const getBlockByIdUtil = async ({
  id,
}: GetBlockByIdInput): Promise<IBlock | null> => {
  const objectId = new mongoose.Types.ObjectId(id);
  const block = await Block.findById(objectId).exec();
  return block;
};


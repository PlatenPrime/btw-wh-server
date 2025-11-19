import { Block, IBlock } from "../../../models/Block.js";

export const getAllBlocksUtil = async (): Promise<IBlock[]> => {
  const blocks = await Block.find({}).sort({ order: 1 }).exec();
  return blocks;
};


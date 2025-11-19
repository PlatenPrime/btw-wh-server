import { Block, IBlock } from "../../../models/Block.js";

type CheckBlockDuplicatesInput = {
  title: string;
};

export const checkBlockDuplicatesUtil = async ({
  title,
}: CheckBlockDuplicatesInput): Promise<IBlock | null> => {
  const existingBlock = await Block.findOne({ title }).exec();
  return existingBlock;
};


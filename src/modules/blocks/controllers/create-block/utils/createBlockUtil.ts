import { Block, IBlock } from "../../../models/Block.js";

type CreateBlockInput = {
  title: string;
};

export const createBlockUtil = async ({
  title,
}: CreateBlockInput): Promise<IBlock> => {
  // Автоматическое определение order: max order + 1 или 1 если первый
  const maxOrderBlock = await Block.findOne({})
    .sort({ order: -1 })
    .exec();

  const order = maxOrderBlock ? maxOrderBlock.order + 1 : 1;

  const block: IBlock = new Block({ title, order });
  await block.save();
  return block as IBlock;
};


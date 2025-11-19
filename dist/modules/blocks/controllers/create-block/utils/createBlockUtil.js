import { Block } from "../../../models/Block.js";
export const createBlockUtil = async ({ title, }) => {
    // Автоматическое определение order: max order + 1 или 0 если первый
    const maxOrderBlock = await Block.findOne({})
        .sort({ order: -1 })
        .exec();
    const order = maxOrderBlock ? maxOrderBlock.order + 1 : 0;
    const block = new Block({ title, order });
    await block.save();
    return block;
};

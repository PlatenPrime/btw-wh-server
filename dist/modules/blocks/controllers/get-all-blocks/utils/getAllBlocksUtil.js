import { Block } from "../../../models/Block.js";
export const getAllBlocksUtil = async () => {
    const blocks = await Block.find({}).sort({ order: 1 }).exec();
    return blocks;
};

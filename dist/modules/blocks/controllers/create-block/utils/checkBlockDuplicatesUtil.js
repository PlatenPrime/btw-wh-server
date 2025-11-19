import { Block } from "../../../models/Block.js";
export const checkBlockDuplicatesUtil = async ({ title, }) => {
    const existingBlock = await Block.findOne({ title }).exec();
    return existingBlock;
};

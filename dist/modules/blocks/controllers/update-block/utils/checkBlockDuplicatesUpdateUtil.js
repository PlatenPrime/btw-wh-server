import { Block } from "../../../models/Block.js";
import mongoose from "mongoose";
export const checkBlockDuplicatesUpdateUtil = async ({ id, title, }) => {
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

import mongoose from "mongoose";
import { Block } from "../../../models/Block.js";
export const renameBlockUtil = async ({ id, title, }) => {
    const objectId = new mongoose.Types.ObjectId(id);
    // Проверить существование блока
    const existingBlock = await Block.findById(objectId).exec();
    if (!existingBlock) {
        return null;
    }
    // Обновить только поле title
    const updatedBlock = await Block.findByIdAndUpdate(objectId, { title }, { new: true }).exec();
    if (!updatedBlock) {
        return null;
    }
    return updatedBlock;
};

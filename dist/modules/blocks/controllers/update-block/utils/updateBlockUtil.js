import mongoose from "mongoose";
import { Block } from "../../../models/Block.js";
import { Seg } from "../../../../segs/models/Seg.js";
export const updateBlockUtil = async ({ id, updateData, }) => {
    const objectId = new mongoose.Types.ObjectId(id);
    // Проверить существование блока
    const existingBlock = await Block.findById(objectId).exec();
    if (!existingBlock) {
        return null;
    }
    // Подготовить данные для обновления блока
    const blockUpdateData = {};
    if (updateData.title !== undefined) {
        blockUpdateData.title = updateData.title;
    }
    if (updateData.order !== undefined) {
        blockUpdateData.order = updateData.order;
    }
    // Если передан список сегментов, обновить массив segs
    if (updateData.segs !== undefined) {
        // Валидация: проверить существование всех сегментов
        const segObjectIds = updateData.segs.map((segId) => new mongoose.Types.ObjectId(segId));
        const existingSegs = await Seg.find({
            _id: { $in: segObjectIds },
            block: objectId, // Сегменты должны принадлежать этому блоку
        }).exec();
        if (existingSegs.length !== segObjectIds.length) {
            throw new Error("One or more segments not found or do not belong to this block");
        }
        // Обновить массив segs в блоке
        blockUpdateData.segs = segObjectIds;
    }
    // Обновить блок
    const updatedBlock = await Block.findByIdAndUpdate(objectId, blockUpdateData, { new: true }).exec();
    if (!updatedBlock) {
        return null;
    }
    return updatedBlock;
};

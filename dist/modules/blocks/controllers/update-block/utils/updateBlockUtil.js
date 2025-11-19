import mongoose from "mongoose";
import { Block } from "../../../models/Block.js";
import { Zone } from "../../../../zones/models/Zone.js";
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
    // Обновить блок
    const updatedBlock = await Block.findByIdAndUpdate(objectId, blockUpdateData, { new: true }).exec();
    if (!updatedBlock) {
        return null;
    }
    // Если передан список зон, обновить связи зон с блоком
    if (updateData.zones !== undefined) {
        // Валидация: проверить существование всех зон
        const zoneIds = updateData.zones.map((z) => new mongoose.Types.ObjectId(z.zoneId));
        const existingZones = await Zone.find({
            _id: { $in: zoneIds },
        }).exec();
        if (existingZones.length !== zoneIds.length) {
            throw new Error("One or more zones not found");
        }
        // Удалить связи со старыми зонами этого блока (которые не в новом списке)
        await Zone.updateMany({
            "block.id": objectId,
            _id: { $nin: zoneIds },
        }, {
            $unset: {
                block: "",
                order: "",
            },
        });
        // Обновить связи для новых зон
        const operations = updateData.zones.map((zoneUpdate) => ({
            updateOne: {
                filter: { _id: new mongoose.Types.ObjectId(zoneUpdate.zoneId) },
                update: {
                    $set: {
                        "block.id": objectId,
                        "block.title": updatedBlock.title,
                        order: zoneUpdate.order,
                    },
                },
            },
        }));
        if (operations.length > 0) {
            await Zone.bulkWrite(operations);
        }
    }
    return updatedBlock;
};

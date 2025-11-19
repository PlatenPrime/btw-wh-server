import mongoose from "mongoose";
import { Block } from "../../../models/Block.js";
import { Zone } from "../../../../zones/models/Zone.js";
export const deleteBlockByIdUtil = async ({ id, }) => {
    const objectId = new mongoose.Types.ObjectId(id);
    // Удалить блок
    const deletedBlock = await Block.findByIdAndDelete(objectId).exec();
    if (!deletedBlock) {
        return null;
    }
    // Обнулить block и order у всех связанных зон
    await Zone.updateMany({ "block.id": objectId }, {
        $unset: {
            block: "",
            order: "",
        },
        $set: {
            sector: 0,
        },
    });
    return deletedBlock;
};

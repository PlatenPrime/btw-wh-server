import mongoose from "mongoose";
import { Block } from "../../../models/Block.js";
import { Seg } from "../../../../segs/models/Seg.js";
import { Zone } from "../../../../zones/models/Zone.js";
export const deleteBlockByIdUtil = async ({ id, }) => {
    const objectId = new mongoose.Types.ObjectId(id);
    // Удалить блок
    const deletedBlock = await Block.findByIdAndDelete(objectId).exec();
    if (!deletedBlock) {
        return null;
    }
    // Получить все сегменты этого блока
    const segs = await Seg.find({ block: objectId }).exec();
    // Собрать все zoneId из всех сегментов
    const zoneIds = segs.flatMap((seg) => seg.zones);
    // Удалить ссылки seg у всех зон, которые были в сегментах этого блока
    if (zoneIds.length > 0) {
        await Zone.updateMany({
            _id: { $in: zoneIds },
        }, {
            $unset: {
                seg: "",
            },
            $set: {
                sector: 0,
            },
        });
    }
    // Удалить все сегменты этого блока
    await Seg.deleteMany({ block: objectId }).exec();
    return deletedBlock;
};

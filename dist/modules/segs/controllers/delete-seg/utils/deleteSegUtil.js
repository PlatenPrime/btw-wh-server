import mongoose from "mongoose";
import { Seg } from "../../../models/Seg.js";
import { Block } from "../../../../blocks/models/Block.js";
import { Zone } from "../../../../zones/models/Zone.js";
export const deleteSegUtil = async ({ segId, session, }) => {
    const objectId = new mongoose.Types.ObjectId(segId);
    // Проверить существование сегмента
    const existingSeg = await Seg.findById(objectId).session(session).exec();
    if (!existingSeg) {
        return null;
    }
    // Удалить ссылки seg из всех зон сегмента
    if (existingSeg.zones.length > 0) {
        await Zone.updateMany({
            _id: { $in: existingSeg.zones },
        }, {
            $unset: {
                seg: "",
            },
            $set: {
                sector: 0,
            },
        }, { session });
    }
    // Удалить сегмент из массива segs блока
    const block = await Block.findById(existingSeg.block).session(session).exec();
    if (block) {
        block.segs = block.segs.filter((segId) => segId.toString() !== objectId.toString());
        await block.save({ session });
    }
    // Удалить сегмент
    const deletedSeg = await Seg.findByIdAndDelete(objectId)
        .session(session)
        .exec();
    return deletedSeg;
};

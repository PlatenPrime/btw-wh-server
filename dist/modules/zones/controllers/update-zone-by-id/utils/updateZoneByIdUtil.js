import { Zone } from "../../../models/Zone.js";
import { Seg } from "../../../../segs/models/Seg.js";
import mongoose from "mongoose";
export const updateZoneByIdUtil = async ({ id, updateData, }) => {
    const zoneObjectId = new mongoose.Types.ObjectId(id);
    // Если обновляется title, нужно синхронизировать его во всех сегментах
    if (updateData.title !== undefined) {
        // Найти все сегменты, содержащие эту зону
        const segsWithZone = await Seg.find({
            "zones._id": zoneObjectId,
        }).exec();
        // Обновить title в каждом сегменте
        for (const seg of segsWithZone) {
            const zoneIndex = seg.zones.findIndex((zone) => zone._id.equals(zoneObjectId));
            if (zoneIndex !== -1) {
                seg.zones[zoneIndex].title = updateData.title;
                await seg.save();
            }
        }
    }
    const updatedZone = await Zone.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    return updatedZone;
};

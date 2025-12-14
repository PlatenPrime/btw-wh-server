import mongoose from "mongoose";
import { Seg } from "../../../../segs/models/Seg.js";
import { IZone, Zone } from "../../../models/Zone.js";
import { UpdateZoneInput } from "../schemas/updateZoneByIdSchema.js";

type UpdateZoneByIdUtilInput = {
  id: string;
  updateData: UpdateZoneInput;
};

export const updateZoneByIdUtil = async ({
  id,
  updateData,
}: UpdateZoneByIdUtilInput): Promise<IZone | null> => {
  const zoneObjectId = new mongoose.Types.ObjectId(id);

  // Сначала обновляем зону
  const updatedZone: IZone | null = await Zone.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  );

  if (!updatedZone) {
    return null;
  }

  // Если обновляется title, нужно синхронизировать его во всех сегментах
  if (updateData.title !== undefined) {
    // Найти все сегменты, содержащие эту зону
    const segsWithZone = await Seg.find({
      "zones._id": zoneObjectId,
    }).exec();

    // Обновить title в каждом сегменте
    for (const seg of segsWithZone) {
      const zoneIndex = seg.zones.findIndex((zone) =>
        zone._id.equals(zoneObjectId)
      );
      if (zoneIndex !== -1) {
        seg.zones[zoneIndex].title = updateData.title;
        await seg.save();
      }
    }
  }

  return updatedZone;
};

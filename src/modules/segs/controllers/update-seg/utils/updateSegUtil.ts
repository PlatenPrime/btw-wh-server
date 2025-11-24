import mongoose from "mongoose";
import { ClientSession } from "mongoose";
import { ISeg, Seg } from "../../../models/Seg.js";
import { Block } from "../../../../blocks/models/Block.js";
import { Zone } from "../../../../zones/models/Zone.js";
import { UpdateSegInput } from "../schemas/updateSegSchema.js";

// Константа для разделения секторов между блоками
const SECTOR_MULTIPLIER = 1000;

type UpdateSegUtilInput = {
  segId: string;
  updateData: Omit<UpdateSegInput, "id">;
  session: ClientSession;
};

export const updateSegUtil = async ({
  segId,
  updateData,
  session,
}: UpdateSegUtilInput): Promise<ISeg | null> => {
  const objectId = new mongoose.Types.ObjectId(segId);

  // Проверить существование сегмента
  const existingSeg = await Seg.findById(objectId).session(session).exec();
  if (!existingSeg) {
    return null;
  }

  // Получить блок для расчета сектора
  const block = await Block.findById(existingSeg.block)
    .session(session)
    .exec();
  if (!block) {
    throw new Error("Block not found");
  }

  const updateDataSeg: Partial<ISeg> = {};

  // Обновить order
  if (updateData.order !== undefined) {
    updateDataSeg.order = updateData.order;
  }

  // Обновить zones
  if (updateData.zones !== undefined) {
    // Валидация: проверить существование всех зон
    const zoneObjectIds = updateData.zones.map(
      (zoneId) => new mongoose.Types.ObjectId(zoneId)
    );
    const existingZones = await Zone.find({
      _id: { $in: zoneObjectIds },
    })
      .session(session)
      .exec();

    if (existingZones.length !== zoneObjectIds.length) {
      throw new Error("One or more zones not found");
    }

    // Валидация: проверить, что зоны не принадлежат другим сегментам
    const zonesWithOtherSegs = existingZones.filter(
      (zone) =>
        zone.seg &&
        zone.seg.id &&
        zone.seg.id.toString() !== segId
    );
    if (zonesWithOtherSegs.length > 0) {
      throw new Error(
        `Zones already belong to other segments: ${zonesWithOtherSegs.map((z) => z._id.toString()).join(", ")}`
      );
    }

    // Собрать старые zoneId
    const oldZoneIds = existingSeg.zones.map((zoneId) => zoneId.toString());
    const newZoneIds = updateData.zones;

    // Найти зоны, которые нужно удалить из сегмента
    const zonesToRemove = oldZoneIds.filter(
      (zoneId) => !newZoneIds.includes(zoneId)
    );

    // Удалить ссылки seg из зон, которые больше не в сегменте
    if (zonesToRemove.length > 0) {
      await Zone.updateMany(
        {
          _id: { $in: zonesToRemove.map((id) => new mongoose.Types.ObjectId(id)) },
        },
        {
          $unset: {
            seg: "",
          },
          $set: {
            sector: 0,
          },
        },
        { session }
      );
    }

    // Обновить массив zones в сегменте
    updateDataSeg.zones = zoneObjectIds;

    // Обновить ссылки seg в новых зонах
    await Zone.updateMany(
      {
        _id: { $in: zoneObjectIds },
      },
      {
        $set: {
          "seg.id": objectId,
        },
      },
      { session }
    );
  }

  // Рассчитать новый сектор
  const order = updateData.order !== undefined ? updateData.order : existingSeg.order;
  const sector = block.order * SECTOR_MULTIPLIER + order;
  updateDataSeg.sector = sector;

  // Обновить сектор во всех зонах сегмента
  const finalZoneIds = updateData.zones !== undefined 
    ? updateData.zones.map((id) => new mongoose.Types.ObjectId(id))
    : existingSeg.zones;
  
  await Zone.updateMany(
    {
      _id: { $in: finalZoneIds },
    },
    {
      $set: {
        sector,
      },
    },
    { session }
  );

  // Обновить сегмент
  const updatedSeg = await Seg.findByIdAndUpdate(
    objectId,
    updateDataSeg,
    { new: true, session }
  ).exec();

  return updatedSeg;
};


import { Types } from "mongoose";
import { ClientSession } from "mongoose";
import { IBlock } from "../../../../blocks/models/Block.js";
import { ISeg, Seg } from "../../../models/Seg.js";
import { Zone } from "../../../../zones/models/Zone.js";

// Константа для разделения секторов между блоками
const SECTOR_MULTIPLIER = 1000;

type CreateSegInput = {
  blockData: IBlock;
  order: number;
  zones: string[];
  session: ClientSession;
};

export const createSegUtil = async ({
  blockData,
  order,
  zones,
  session,
}: CreateSegInput): Promise<ISeg> => {
  // Валидация: проверить существование всех зон
  const zoneObjectIds = zones.map((zoneId) => new Types.ObjectId(zoneId));
  const existingZones = await Zone.find({
    _id: { $in: zoneObjectIds },
  })
    .session(session)
    .exec();

  if (existingZones.length !== zoneObjectIds.length) {
    throw new Error("One or more zones not found");
  }

  // Валидация: проверить, что зоны не принадлежат другим сегментам
  const zonesWithSeg = existingZones.filter(
    (zone) => zone.seg && zone.seg.id
  );
  if (zonesWithSeg.length > 0) {
    throw new Error(
      `Zones already belong to segments: ${zonesWithSeg.map((z) => z._id.toString()).join(", ")}`
    );
  }

  // Рассчитать сектор для сегмента
  const sector = blockData.order * SECTOR_MULTIPLIER + order;

  // Создать сегмент
  const created = await Seg.create(
    [
      {
        block: blockData._id,
        blockData: { _id: blockData._id, title: blockData.title },
        sector,
        order,
        zones: zoneObjectIds,
      },
    ],
    { session }
  );

  if (!created || !created[0]) {
    throw new Error("Failed to create segment");
  }

  // Добавить сегмент в массив segs блока
  blockData.segs.push(created[0]._id as Types.ObjectId);
  await blockData.save({ session });

  // Обновить ссылки seg в зонах
  await Zone.updateMany(
    {
      _id: { $in: zoneObjectIds },
    },
    {
      $set: {
        "seg.id": created[0]._id,
        sector,
      },
    },
    { session }
  );

  return created[0];
};


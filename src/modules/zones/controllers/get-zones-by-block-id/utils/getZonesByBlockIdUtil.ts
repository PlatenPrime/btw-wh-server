import mongoose from "mongoose";
import { IZone, Zone } from "../../../models/Zone.js";
import { Seg } from "../../../../segs/models/Seg.js";

type GetZonesByBlockIdInput = {
  blockId: string;
};

export const getZonesByBlockIdUtil = async ({
  blockId,
}: GetZonesByBlockIdInput): Promise<IZone[]> => {
  const objectId = new mongoose.Types.ObjectId(blockId);
  
  // Получить все сегменты этого блока
  const segs = await Seg.find({ block: objectId }).exec();
  
  // Собрать все zoneId из всех сегментов
  const zoneIds = segs.flatMap((seg) => seg.zones);
  
  // Получить все зоны этих сегментов
  const zones = await Zone.find({
    _id: { $in: zoneIds },
  }).exec();
  
  return zones;
};


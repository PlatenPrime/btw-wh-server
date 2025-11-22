import mongoose from "mongoose";
import { IZone, Zone } from "../../../models/Zone.js";

type GetZonesByBlockIdInput = {
  blockId: string;
};

export const getZonesByBlockIdUtil = async ({
  blockId,
}: GetZonesByBlockIdInput): Promise<IZone[]> => {
  const objectId = new mongoose.Types.ObjectId(blockId);
  
  const zones = await Zone.find({ "block.id": objectId })
    .sort({ order: 1 })
    .exec();
  
  return zones;
};


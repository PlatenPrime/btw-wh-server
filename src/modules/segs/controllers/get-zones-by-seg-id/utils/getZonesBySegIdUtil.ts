import mongoose from "mongoose";
import { IZone, Zone } from "../../../../zones/models/Zone.js";

type GetZonesBySegIdInput = {
  segId: string;
};

export const getZonesBySegIdUtil = async ({
  segId,
}: GetZonesBySegIdInput): Promise<IZone[]> => {
  const objectId = new mongoose.Types.ObjectId(segId);
  
  const zones = await Zone.find({ "seg.id": objectId }).exec();
  
  return zones;
};


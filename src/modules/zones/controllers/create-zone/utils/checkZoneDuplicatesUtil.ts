import { IZone, Zone } from "../../../models/Zone.js";
import { CreateZoneInput } from "../../../schemas/zoneSchema.js";

export const checkZoneDuplicatesUtil = async (
  zoneData: CreateZoneInput
): Promise<IZone | null> => {
  const existingZone = await Zone.findOne({
    $or: [{ title: zoneData.title }, { bar: zoneData.bar }],
  });

  return existingZone as IZone | null;
};

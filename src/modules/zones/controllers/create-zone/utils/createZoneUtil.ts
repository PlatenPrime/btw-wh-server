import { IZone, Zone } from "../../../models/Zone.js";
import { CreateZoneInput } from "../schemas/createZoneSchema.js";

export const createZoneUtil = async (
  zoneData: CreateZoneInput
): Promise<IZone> => {
  const zone: IZone = new Zone(zoneData);
  await zone.save();
  return zone as IZone;
};


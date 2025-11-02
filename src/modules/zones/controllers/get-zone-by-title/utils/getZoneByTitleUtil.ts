import { IZone, Zone } from "../../../models/Zone.js";

export const getZoneByTitleUtil = async (
  title: string
): Promise<IZone | null> => {
  const zone: IZone | null = await Zone.findOne({ title: title.trim() });
  return zone;
};







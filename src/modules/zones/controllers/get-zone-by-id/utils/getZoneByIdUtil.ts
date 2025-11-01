import { IZone, Zone } from "../../../models/Zone.js";

export const getZoneByIdUtil = async (id: string): Promise<IZone | null> => {
  const zone: IZone | null = await Zone.findById(id);
  return zone;
};




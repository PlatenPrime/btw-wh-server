import { IZone, Zone } from "../../../models/Zone.js";

export const deleteZoneByIdUtil = async (
  id: string
): Promise<IZone | null> => {
  const deletedZone: IZone | null = await Zone.findByIdAndDelete(id);
  return deletedZone;
};









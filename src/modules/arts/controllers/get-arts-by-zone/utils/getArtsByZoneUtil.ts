import { IArt, Art } from "../../../models/Art.js";

export const getArtsByZoneUtil = async (zone: string): Promise<IArt[]> => {
  const arts: IArt[] = await Art.find({ zone }).sort({ artikul: 1 });
  return arts;
};


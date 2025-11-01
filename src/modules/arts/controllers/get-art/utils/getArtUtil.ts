import { IArt, Art } from "../../../models/Art.js";

export const getArtUtil = async (artikul: string): Promise<IArt | null> => {
  const art: IArt | null = await Art.findOne({ artikul: artikul });
  return art;
};


import { IArt, Art } from "../../../models/Art.js";

export const getArtByIdUtil = async (id: string): Promise<IArt | null> => {
  const art: IArt | null = await Art.findById(id);
  return art;
};


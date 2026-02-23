import { Konk, IKonk } from "../../../models/Konk.js";

export const getKonkByNameUtil = async (
  name: string
): Promise<IKonk | null> => {
  const konk = await Konk.findOne({ name });
  return konk;
};

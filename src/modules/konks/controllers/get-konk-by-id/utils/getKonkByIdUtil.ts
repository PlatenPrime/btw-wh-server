import { Konk, IKonk } from "../../../models/Konk.js";

export const getKonkByIdUtil = async (id: string): Promise<IKonk | null> => {
  const konk = await Konk.findById(id);
  return konk;
};

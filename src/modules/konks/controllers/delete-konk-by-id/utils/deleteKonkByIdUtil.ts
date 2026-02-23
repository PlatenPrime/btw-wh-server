import { Konk, IKonk } from "../../../models/Konk.js";

export const deleteKonkByIdUtil = async (
  id: string
): Promise<IKonk | null> => {
  const konk = await Konk.findByIdAndDelete(id);
  return konk;
};

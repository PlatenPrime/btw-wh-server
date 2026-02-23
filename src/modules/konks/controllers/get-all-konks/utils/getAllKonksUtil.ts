import { Konk, IKonk } from "../../../models/Konk.js";

export const getAllKonksUtil = async (): Promise<IKonk[]> => {
  const list = await Konk.find().sort({ createdAt: -1 }).lean();
  return list as IKonk[];
};

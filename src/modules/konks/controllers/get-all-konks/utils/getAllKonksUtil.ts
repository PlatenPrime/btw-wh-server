import { IKonk, Konk } from "../../../models/Konk.js";

export const getAllKonksUtil = async (): Promise<IKonk[]> => {
  const list = await Konk.find().sort({ title: 1 }).lean();
  return list as IKonk[];
};

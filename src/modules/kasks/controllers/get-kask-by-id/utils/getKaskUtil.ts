import { IKask, Kask } from "../../../models/Kask.js";

export const getKaskUtil = async (id: string): Promise<IKask | null> => {
  return Kask.findById(id);
};

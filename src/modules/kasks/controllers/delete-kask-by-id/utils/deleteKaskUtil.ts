import { IKask, Kask } from "../../../models/Kask.js";

export const deleteKaskUtil = async (id: string): Promise<IKask | null> => {
  return Kask.findByIdAndDelete(id);
};

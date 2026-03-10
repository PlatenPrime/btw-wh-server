import { IKask, Kask } from "../../../models/Kask.js";

export const updateKaskUtil = async (
  id: string,
  update: Partial<{
    artikul: string;
    nameukr: string;
    quant: number;
    zone: string;
    com: string;
  }>
): Promise<IKask | null> => {
  return Kask.findByIdAndUpdate(id, { $set: update }, { new: true });
};

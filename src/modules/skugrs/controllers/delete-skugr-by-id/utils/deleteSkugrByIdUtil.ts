import { ISkugr, Skugr } from "../../../models/Skugr.js";

export const deleteSkugrByIdUtil = async (
  id: string,
): Promise<ISkugr | null> => {
  const skugr = await Skugr.findByIdAndDelete(id);
  return skugr;
};

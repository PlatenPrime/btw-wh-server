import { Del, IDel } from "../../../models/Del.js";

export const deleteDelByIdUtil = async (
  id: string
): Promise<IDel | null> => {
  const del = await Del.findByIdAndDelete(id);
  return del;
};

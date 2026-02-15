import { Del, IDel } from "../../../models/Del.js";

export const getDelByIdUtil = async (id: string): Promise<IDel | null> => {
  const del = await Del.findById(id);
  return del;
};

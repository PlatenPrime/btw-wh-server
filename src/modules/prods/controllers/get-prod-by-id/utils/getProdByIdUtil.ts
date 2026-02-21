import { Prod, IProd } from "../../../models/Prod.js";

export const getProdByIdUtil = async (id: string): Promise<IProd | null> => {
  const prod = await Prod.findById(id);
  return prod;
};

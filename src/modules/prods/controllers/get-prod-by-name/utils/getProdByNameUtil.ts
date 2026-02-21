import { Prod, IProd } from "../../../models/Prod.js";

export const getProdByNameUtil = async (
  name: string
): Promise<IProd | null> => {
  const prod = await Prod.findOne({ name });
  return prod;
};

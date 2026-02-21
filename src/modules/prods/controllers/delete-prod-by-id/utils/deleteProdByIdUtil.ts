import { Prod, IProd } from "../../../models/Prod.js";

export const deleteProdByIdUtil = async (
  id: string
): Promise<IProd | null> => {
  const prod = await Prod.findByIdAndDelete(id);
  return prod;
};

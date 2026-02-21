import { Prod, IProd } from "../../../models/Prod.js";

export const getAllProdsUtil = async (): Promise<IProd[]> => {
  const list = await Prod.find().sort({ createdAt: -1 }).lean();
  return list as IProd[];
};

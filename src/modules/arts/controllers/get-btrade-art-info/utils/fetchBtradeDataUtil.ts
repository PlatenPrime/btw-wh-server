import { getSharikData, SharikProductInfo } from "../../../../../utils/index.js";

export const fetchBtradeDataUtil = async (
  artikul: string
): Promise<SharikProductInfo | null> => {
  const data = await getSharikData(artikul);
  return data;
};


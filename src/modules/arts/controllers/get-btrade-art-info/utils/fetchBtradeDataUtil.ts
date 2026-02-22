import { getSharikStockData, SharikProductInfo } from "../../../../../utils/index.js";

export const fetchBtradeDataUtil = async (
  artikul: string
): Promise<SharikProductInfo | null> => {
  const data = await getSharikStockData(artikul);
  return data;
};


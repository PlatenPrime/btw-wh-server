import { getSharikStockData } from "../../../../../utils/index.js";
export const fetchBtradeDataUtil = async (artikul) => {
    const data = await getSharikStockData(artikul);
    return data;
};

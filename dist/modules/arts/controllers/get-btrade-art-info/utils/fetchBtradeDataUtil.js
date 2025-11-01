import { getSharikData } from "../../../../../utils/index.js";
export const fetchBtradeDataUtil = async (artikul) => {
    const data = await getSharikData(artikul);
    return data;
};

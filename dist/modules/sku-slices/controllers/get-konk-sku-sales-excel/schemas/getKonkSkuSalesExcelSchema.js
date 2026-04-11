import { z } from "zod";
import { konkProdRangeSchema } from "../../common/schemas/konkProdRangeSchema.js";
const sortBySchema = z.preprocess((val) => {
    if (val === "" || val === undefined || val === null)
        return undefined;
    return val;
}, z.enum(["sales", "revenue"]).optional());
export const getKonkSkuSalesExcelSchema = konkProdRangeSchema.and(z.object({
    sortBy: sortBySchema,
}));

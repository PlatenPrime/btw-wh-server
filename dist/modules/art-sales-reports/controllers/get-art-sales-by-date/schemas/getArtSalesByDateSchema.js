import { z } from "zod";
import { dateStringSchema } from "../../../../sku-reporting/schemas/dateSchema.js";
import { artikulParamSchema } from "../../../../art-reporting/schemas/artikulParamSchema.js";
export const getArtSalesByDateSchema = z.object({
    artikul: artikulParamSchema,
    date: dateStringSchema,
});

import { z } from "zod";
import { dateStringSchema } from "../../../../sku-reporting/schemas/dateSchema.js";
export const getCatalogNewSinceExcelQuerySchema = z.object({
    konk: z.string().min(1, "konk is required"),
    since: dateStringSchema,
});

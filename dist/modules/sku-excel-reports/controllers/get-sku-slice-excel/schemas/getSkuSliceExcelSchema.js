import mongoose from "mongoose";
import { z } from "zod";
import { dateStringSchema } from "../../../../sku-reporting/schemas/dateSchema.js";
export const getSkuSliceExcelSchema = z
    .object({
    skuId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid sku ID format",
    }),
    dateFrom: dateStringSchema,
    dateTo: dateStringSchema,
})
    .refine((data) => data.dateFrom.getTime() <= data.dateTo.getTime(), {
    message: "dateFrom must be before or equal to dateTo",
    path: ["dateTo"],
});

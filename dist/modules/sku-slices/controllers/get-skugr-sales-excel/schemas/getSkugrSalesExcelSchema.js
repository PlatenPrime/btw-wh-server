import mongoose from "mongoose";
import { z } from "zod";
import { dateStringSchema } from "../../common/schemas/dateSchema.js";
export const getSkugrSalesExcelSchema = z
    .object({
    skugrId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid skugr ID format",
    }),
    dateFrom: dateStringSchema,
    dateTo: dateStringSchema,
})
    .refine((data) => data.dateFrom.getTime() <= data.dateTo.getTime(), {
    message: "dateFrom must be before or equal to dateTo",
    path: ["dateTo"],
});

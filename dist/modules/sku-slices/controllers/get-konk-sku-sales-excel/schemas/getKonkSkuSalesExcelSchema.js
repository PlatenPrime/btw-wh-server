import { z } from "zod";
import { dateStringSchema } from "../../common/schemas/dateSchema.js";
export const getKonkSkuSalesExcelSchema = z
    .object({
    konk: z.string().trim().min(1, "konk is required"),
    dateFrom: dateStringSchema,
    dateTo: dateStringSchema,
})
    .refine((data) => data.dateFrom.getTime() <= data.dateTo.getTime(), {
    message: "dateFrom must be before or equal to dateTo",
    path: ["dateTo"],
});

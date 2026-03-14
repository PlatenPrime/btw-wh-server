import { z } from "zod";
import { dateStringSchema } from "./dateSchema.js";
const nonEmptyString = z.string().min(1, "Value is required");
export const konkBtradeRangeSchema = z
    .object({
    konk: nonEmptyString,
    prod: nonEmptyString,
    dateFrom: dateStringSchema,
    dateTo: dateStringSchema,
})
    .refine((data) => data.dateFrom.getTime() <= data.dateTo.getTime(), {
    message: "dateFrom must be before or equal to dateTo",
    path: ["dateTo"],
});

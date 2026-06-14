import { z } from "zod";
import { dateStringSchema } from "../../sku-reporting/schemas/dateSchema.js";
export const artDateRangeFieldsSchema = z.object({
    dateFrom: dateStringSchema,
    dateTo: dateStringSchema,
});
export const artDateRangeSchema = artDateRangeFieldsSchema.refine((data) => data.dateFrom.getTime() <= data.dateTo.getTime(), {
    message: "dateFrom must be before or equal to dateTo",
    path: ["dateTo"],
});
export const artDateRangeRefine = {
    message: "dateFrom must be before or equal to dateTo",
    path: ["dateTo"],
    check: (data) => data.dateFrom.getTime() <= data.dateTo.getTime(),
};

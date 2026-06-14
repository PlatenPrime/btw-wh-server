import { z } from "zod";
import { dateStringSchema } from "../../sku-reporting/schemas/dateSchema.js";

export const artDateRangeFieldsSchema = z.object({
  dateFrom: dateStringSchema,
  dateTo: dateStringSchema,
});

export const artDateRangeSchema = artDateRangeFieldsSchema.refine(
  (data) => data.dateFrom.getTime() <= data.dateTo.getTime(),
  {
    message: "dateFrom must be before or equal to dateTo",
    path: ["dateTo"],
  },
);

export type ArtDateRangeInput = z.infer<typeof artDateRangeSchema>;

export const artDateRangeRefine = {
  message: "dateFrom must be before or equal to dateTo",
  path: ["dateTo"] as const,
  check: (data: { dateFrom: Date; dateTo: Date }) =>
    data.dateFrom.getTime() <= data.dateTo.getTime(),
};

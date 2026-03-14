import { z } from "zod";
import { dateStringSchema } from "../../common/schemas/dateSchema.js";

const nonEmptyString = z.string().min(1, "Value is required");

export const getKonkBtradeSalesComparisonSchema = z
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

export type GetKonkBtradeSalesComparisonInput = z.infer<
  typeof getKonkBtradeSalesComparisonSchema
>;

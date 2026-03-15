import { z } from "zod";
import { dateStringSchema } from "./dateSchema.js";

const nonEmptyString = z.string().min(1, "Value is required");

const abcEnum = z.enum(["A", "B", "C", "D"]);
const sortByEnum = z.enum(["abc"]);

export const konkBtradeRangeSchema = z
  .object({
    konk: nonEmptyString,
    prod: nonEmptyString,
    dateFrom: dateStringSchema,
    dateTo: dateStringSchema,
    abc: abcEnum.optional(),
    sortBy: sortByEnum.optional(),
  })
  .refine((data) => data.dateFrom.getTime() <= data.dateTo.getTime(), {
    message: "dateFrom must be before or equal to dateTo",
    path: ["dateTo"],
  });

export type KonkBtradeRangeInput = z.infer<typeof konkBtradeRangeSchema>;

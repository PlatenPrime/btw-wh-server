import { z } from "zod";

const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD")
  .transform((s) => {
    const d = new Date(s + "T00:00:00.000Z");
    if (Number.isNaN(d.getTime())) {
      throw new Error("Invalid date");
    }
    return d;
  });

const nonEmptyString = z.string().min(1, "Value is required");

export const getKonkBtradeComparisonExcelSchema = z
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

export type GetKonkBtradeComparisonExcelInput = z.infer<
  typeof getKonkBtradeComparisonExcelSchema
>;


import { z } from "zod";
import { dateStringSchema } from "../../../../sku-reporting/schemas/dateSchema.js";
import { excludeKonksSchema } from "../../../../sku-reporting/schemas/excludeKonksSchema.js";

export const getProdKonksPieDataSchema = z
  .object({
    prod: z.string().trim().min(1, "prod is required"),
    dateFrom: dateStringSchema,
    dateTo: dateStringSchema,
    excludeKonks: excludeKonksSchema,
  })
  .refine((data) => data.dateFrom.getTime() <= data.dateTo.getTime(), {
    message: "dateFrom must be before or equal to dateTo",
    path: ["dateTo"],
  });

export type GetProdKonksPieDataInput = z.infer<typeof getProdKonksPieDataSchema>;

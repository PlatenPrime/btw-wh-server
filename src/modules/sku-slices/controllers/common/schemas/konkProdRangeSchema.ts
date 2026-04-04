import { z } from "zod";
import { dateStringSchema } from "./dateSchema.js";

export const konkProdRangeSchema = z
  .object({
    konk: z.string().trim().min(1, "konk is required"),
    prod: z.string().trim().min(1, "prod is required"),
    dateFrom: dateStringSchema,
    dateTo: dateStringSchema,
  })
  .refine((data) => data.dateFrom.getTime() <= data.dateTo.getTime(), {
    message: "dateFrom must be before or equal to dateTo",
    path: ["dateTo"],
  });

export type KonkProdRangeInput = z.infer<typeof konkProdRangeSchema>;

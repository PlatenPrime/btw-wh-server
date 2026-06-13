import { z } from "zod";
import { dateStringSchema } from "../../../../sku-reporting/schemas/dateSchema.js";
import { skugrIdsSchema } from "../../../../sku-reporting/schemas/skugrIdsSchema.js";

export const getKonkProdManufacturersPieDataSchema = z
  .object({
    konk: z.string().trim().min(1, "konk is required"),
    dateFrom: dateStringSchema,
    dateTo: dateStringSchema,
    skugrIds: skugrIdsSchema,
  })
  .refine((data) => data.dateFrom.getTime() <= data.dateTo.getTime(), {
    message: "dateFrom must be before or equal to dateTo",
    path: ["dateTo"],
  });

export type GetKonkProdManufacturersPieDataInput = z.infer<
  typeof getKonkProdManufacturersPieDataSchema
>;

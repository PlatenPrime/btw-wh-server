import { z } from "zod";
import { dateStringSchema } from "../../../../sku-reporting/schemas/dateSchema.js";

export const getKonkNewSinceExcelParamsSchema = z.object({
  konkName: z.string().min(1, "konkName is required"),
});

export const getKonkNewSinceExcelQuerySchema = z.object({
  since: dateStringSchema,
});

export type GetKonkNewSinceExcelParams = z.infer<
  typeof getKonkNewSinceExcelParamsSchema
>;
export type GetKonkNewSinceExcelQuery = z.infer<
  typeof getKonkNewSinceExcelQuerySchema
>;

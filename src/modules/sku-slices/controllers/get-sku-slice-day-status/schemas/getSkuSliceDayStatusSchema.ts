import { z } from "zod";
import { dateStringSchema } from "../../../../sku-reporting/schemas/dateSchema.js";

export const getSkuSliceDayStatusSchema = z.object({
  konkName: z.string().min(1, "konkName is required"),
  date: dateStringSchema,
});

export type GetSkuSliceDayStatusQuery = z.infer<
  typeof getSkuSliceDayStatusSchema
>;

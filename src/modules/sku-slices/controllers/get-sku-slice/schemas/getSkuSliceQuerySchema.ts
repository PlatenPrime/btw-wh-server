import { z } from "zod";
import { dateStringSchema } from "../../common/schemas/dateSchema.js";

export const getSkuSliceQuerySchema = z.object({
  konkName: z.string().min(1, "konkName is required"),
  date: dateStringSchema,
});

export type GetSkuSliceQuery = z.infer<typeof getSkuSliceQuerySchema>;

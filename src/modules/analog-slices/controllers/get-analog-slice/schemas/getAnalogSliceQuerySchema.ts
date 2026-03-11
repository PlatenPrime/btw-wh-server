import { z } from "zod";
import { dateStringSchema } from "../../common/schemas/dateSchema.js";

export const getAnalogSliceQuerySchema = z.object({
  konkName: z.string().min(1, "konkName is required"),
  date: dateStringSchema,
});

export type GetAnalogSliceQuery = z.infer<typeof getAnalogSliceQuerySchema>;

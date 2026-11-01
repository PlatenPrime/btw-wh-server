import mongoose from "mongoose";
import { z } from "zod";
import { dateStringSchema } from "../../../../sku-reporting/schemas/dateSchema.js";

const objectIdString = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: "Invalid sku ID format",
});

export const getSelectionSkusPieDataSchema = z
  .object({
    skuIds: z.array(objectIdString).min(1).max(100),
    dateFrom: dateStringSchema,
    dateTo: dateStringSchema,
  })
  .refine((data) => data.dateFrom.getTime() <= data.dateTo.getTime(), {
    message: "dateFrom must be before or equal to dateTo",
    path: ["dateTo"],
  });

export type GetSelectionSkusPieDataInput = z.infer<typeof getSelectionSkusPieDataSchema>;

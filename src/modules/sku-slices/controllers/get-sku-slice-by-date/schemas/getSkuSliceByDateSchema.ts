import mongoose from "mongoose";
import { z } from "zod";
import { dateStringSchema } from "../../common/schemas/dateSchema.js";

export const getSkuSliceByDateSchema = z.object({
  skuId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid sku ID format",
  }),
  date: dateStringSchema,
});

export type GetSkuSliceByDateInput = z.infer<typeof getSkuSliceByDateSchema>;

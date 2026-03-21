import mongoose from "mongoose";
import { z } from "zod";
import { dateStringSchema } from "../../common/schemas/dateSchema.js";

export const getSkuSalesByDateSchema = z.object({
  skuId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid sku ID format",
  }),
  date: dateStringSchema,
});

export type GetSkuSalesByDateInput = z.infer<typeof getSkuSalesByDateSchema>;

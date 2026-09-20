import mongoose from "mongoose";
import { z } from "zod";
import { dateStringSchema } from "../../../../sku-reporting/schemas/dateSchema.js";

const finiteNumberSchema = z.number().finite();

export const patchSkuSliceByDateSchema = z.object({
  skuId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid sku ID format",
  }),
  date: dateStringSchema,
  stock: finiteNumberSchema,
  price: finiteNumberSchema,
});

export type PatchSkuSliceByDateInput = z.infer<
  typeof patchSkuSliceByDateSchema
>;

import mongoose from "mongoose";
import { z } from "zod";

export const getSkusBySkugrIdParamsSchema = z.object({
  skugrId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid skugr ID format",
  }),
});

export type GetSkusBySkugrIdParams = z.infer<
  typeof getSkusBySkugrIdParamsSchema
>;

import mongoose from "mongoose";
import { z } from "zod";

export const getSkuStockBandByIdSchema = z
  .object({
    id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
      message: "Invalid band ID format",
    }),
  })
  .strict();

export type GetSkuStockBandByIdInput = z.infer<typeof getSkuStockBandByIdSchema>;

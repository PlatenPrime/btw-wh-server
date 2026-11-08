import mongoose from "mongoose";
import { z } from "zod";

export const deleteSkuStockBandByIdSchema = z
  .object({
    id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
      message: "Invalid band ID format",
    }),
  })
  .strict();

export type DeleteSkuStockBandByIdInput = z.infer<typeof deleteSkuStockBandByIdSchema>;

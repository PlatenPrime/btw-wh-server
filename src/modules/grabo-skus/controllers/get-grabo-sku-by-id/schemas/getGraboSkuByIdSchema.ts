import mongoose from "mongoose";
import { z } from "zod";

export const getGraboSkuByIdSchema = z.object({
  id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid grabo sku ID format",
  }),
});

export type GetGraboSkuByIdInput = z.infer<typeof getGraboSkuByIdSchema>;

import mongoose from "mongoose";
import { z } from "zod";

export const updateSkuByIdSchema = z.object({
  id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid sku ID format",
  }),
  konkName: z.string().min(1).optional(),
  prodName: z.string().min(1).optional(),
  btradeAnalog: z.string().optional(),
  title: z.string().min(1).optional(),
  url: z.string().url("Url must be a valid URL").optional(),
});

export type UpdateSkuByIdInput = z.infer<typeof updateSkuByIdSchema>;

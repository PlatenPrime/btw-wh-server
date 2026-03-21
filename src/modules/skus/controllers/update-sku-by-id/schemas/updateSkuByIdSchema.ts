import mongoose from "mongoose";
import { z } from "zod";

const optionalProductId = z
  .string()
  .min(1)
  .regex(/^[a-z0-9_-]+-[A-Za-z0-9_-]+$/)
  .optional();

export const updateSkuByIdSchema = z.object({
  id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid sku ID format",
  }),
  konkName: z.string().min(1).optional(),
  prodName: z.string().min(1).optional(),
  productId: optionalProductId,
  btradeAnalog: z.string().optional(),
  title: z.string().min(1).optional(),
  url: z.string().url("Url must be a valid URL").optional(),
  imageUrl: z.string().optional(),
});

export type UpdateSkuByIdInput = z.infer<typeof updateSkuByIdSchema>;

import mongoose from "mongoose";
import { z } from "zod";

export const getVariantByIdSchema = z.object({
  id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid variant ID format",
  }),
});

export type GetVariantByIdInput = z.infer<typeof getVariantByIdSchema>;


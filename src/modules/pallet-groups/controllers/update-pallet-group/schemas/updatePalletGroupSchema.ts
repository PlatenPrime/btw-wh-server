import mongoose from "mongoose";
import { z } from "zod";

export const updatePalletGroupSchema = z.object({
  id: z
    .string()
    .refine((val) => mongoose.Types.ObjectId.isValid(val), {
      message: "Invalid pallet group ID format",
    }),
  title: z.string().min(1, "Title is required").optional(),
  order: z.number().int().min(1, "Order must be at least 1").optional(),
});

export type UpdatePalletGroupInput = z.infer<typeof updatePalletGroupSchema>;


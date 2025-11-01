import mongoose from "mongoose";
import { z } from "zod";

export const deletePalletSchema = z.object({
  id: z
    .string()
    .refine((val) => mongoose.Types.ObjectId.isValid(val), {
      message: "Invalid pallet ID format",
    }),
});

export type DeletePalletInput = z.infer<typeof deletePalletSchema>;



import mongoose from "mongoose";
import { z } from "zod";

export const deletePalletPosesSchema = z.object({
  id: z
    .string()
    .refine((val) => mongoose.Types.ObjectId.isValid(val), {
      message: "Invalid pallet ID format",
    }),
});

export type DeletePalletPosesInput = z.infer<typeof deletePalletPosesSchema>;






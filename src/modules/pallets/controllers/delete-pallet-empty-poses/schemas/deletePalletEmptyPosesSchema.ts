import mongoose from "mongoose";
import { z } from "zod";

export const deletePalletEmptyPosesSchema = z.object({
  id: z
    .string()
    .refine((val) => mongoose.Types.ObjectId.isValid(val), {
      message: "Invalid pallet ID format",
    }),
});

export type DeletePalletEmptyPosesInput = z.infer<
  typeof deletePalletEmptyPosesSchema
>;





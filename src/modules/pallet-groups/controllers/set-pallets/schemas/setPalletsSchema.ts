import mongoose from "mongoose";
import { z } from "zod";

export const setPalletsSchema = z.object({
  groupId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid pallet group ID format",
  }),
  palletIds: z
    .array(
      z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid pallet ID format",
      }),
    )
    .min(1, "At least one pallet ID must be provided")
    .refine((arr) => new Set(arr).size === arr.length, {
      message: "Duplicate pallet IDs are not allowed",
    }),
});

export type SetPalletsInput = z.infer<typeof setPalletsSchema>;

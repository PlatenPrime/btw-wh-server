import mongoose from "mongoose";
import { z } from "zod";

export const setPalletGroupSchema = z.object({
  id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid pallet ID format",
  }),
  groupId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid group ID format",
  }),
});

export type SetPalletGroupInput = z.infer<typeof setPalletGroupSchema>;

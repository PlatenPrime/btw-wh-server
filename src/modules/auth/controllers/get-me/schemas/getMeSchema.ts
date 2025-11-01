import mongoose from "mongoose";
import { z } from "zod";

export const getMeSchema = z.object({
  id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid user ID format",
  }),
});

export type GetMeInput = z.infer<typeof getMeSchema>;


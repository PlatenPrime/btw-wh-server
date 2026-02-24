import mongoose from "mongoose";
import { z } from "zod";

export const deleteConstantByIdSchema = z.object({
  id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid constant ID format",
  }),
});

export type DeleteConstantByIdInput = z.infer<typeof deleteConstantByIdSchema>;

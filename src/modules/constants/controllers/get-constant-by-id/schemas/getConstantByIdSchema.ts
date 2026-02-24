import mongoose from "mongoose";
import { z } from "zod";

export const getConstantByIdSchema = z.object({
  id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid constant ID format",
  }),
});

export type GetConstantByIdInput = z.infer<typeof getConstantByIdSchema>;

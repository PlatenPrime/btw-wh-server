import mongoose from "mongoose";
import { z } from "zod";

export const updateRowSchema = z.object({
  id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid row ID format",
  }),
  title: z.string().min(1, "Title is required").optional(),
}).refine((data) => data.title !== undefined, {
  message: "At least one field must be provided for update",
});

export type UpdateRowInput = z.infer<typeof updateRowSchema>;


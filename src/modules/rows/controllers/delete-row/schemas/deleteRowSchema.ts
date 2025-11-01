import mongoose from "mongoose";
import { z } from "zod";

export const deleteRowSchema = z.object({
  id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid row ID format",
  }),
});

export type DeleteRowInput = z.infer<typeof deleteRowSchema>;


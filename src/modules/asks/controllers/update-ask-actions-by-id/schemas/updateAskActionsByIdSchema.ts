import mongoose from "mongoose";
import { z } from "zod";

export const updateAskActionsByIdSchema = z.object({
  id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid ask ID format",
  }),
  action: z.string().min(1, "Action is required"),
  userId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid user ID format",
  }),
});

export type UpdateAskActionsByIdInput = z.infer<
  typeof updateAskActionsByIdSchema
>;


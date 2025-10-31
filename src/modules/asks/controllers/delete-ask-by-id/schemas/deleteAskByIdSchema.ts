import mongoose from "mongoose";
import { z } from "zod";

export const deleteAskByIdSchema = z.object({
  id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid ask ID format",
  }),
});

export type DeleteAskByIdInput = z.infer<typeof deleteAskByIdSchema>;


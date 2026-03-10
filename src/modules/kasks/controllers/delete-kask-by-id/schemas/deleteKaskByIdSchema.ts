import mongoose from "mongoose";
import { z } from "zod";

export const deleteKaskByIdSchema = z.object({
  id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid kask ID format",
  }),
});

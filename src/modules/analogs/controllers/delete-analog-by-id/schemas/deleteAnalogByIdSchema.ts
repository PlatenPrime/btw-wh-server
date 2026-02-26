import mongoose from "mongoose";
import { z } from "zod";

export const deleteAnalogByIdSchema = z.object({
  id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid analog ID format",
  }),
});

export type DeleteAnalogByIdInput = z.infer<typeof deleteAnalogByIdSchema>;

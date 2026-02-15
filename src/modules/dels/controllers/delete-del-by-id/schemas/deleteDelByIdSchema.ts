import mongoose from "mongoose";
import { z } from "zod";

export const deleteDelByIdSchema = z.object({
  id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid del ID format",
  }),
});

export type DeleteDelByIdInput = z.infer<typeof deleteDelByIdSchema>;

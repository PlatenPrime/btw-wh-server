import { z } from "zod";
import mongoose from "mongoose";

export const getSegByIdSchema = z.object({
  id: z.string().refine(
    (val) => mongoose.Types.ObjectId.isValid(val),
    {
      message: "Invalid segment ID format",
    }
  ),
});

export type GetSegByIdInput = z.infer<typeof getSegByIdSchema>;


import { z } from "zod";
import mongoose from "mongoose";

export const getSegsByBlockIdSchema = z.object({
  blockId: z.string().refine(
    (val) => mongoose.Types.ObjectId.isValid(val),
    {
      message: "Invalid block ID format",
    }
  ),
});

export type GetSegsByBlockIdInput = z.infer<typeof getSegsByBlockIdSchema>;


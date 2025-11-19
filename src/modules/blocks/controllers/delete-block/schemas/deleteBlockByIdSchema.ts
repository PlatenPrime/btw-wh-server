import { z } from "zod";
import mongoose from "mongoose";

// Схема для удаления блока по ID
export const deleteBlockByIdSchema = z.object({
  id: z.string().refine(
    (val) => mongoose.Types.ObjectId.isValid(val),
    {
      message: "Invalid block ID format",
    }
  ),
});

export type DeleteBlockByIdInput = z.infer<typeof deleteBlockByIdSchema>;


import { z } from "zod";
import mongoose from "mongoose";

// Схема для получения блока по ID
export const getBlockByIdSchema = z.object({
  id: z.string().refine(
    (val) => mongoose.Types.ObjectId.isValid(val),
    {
      message: "Invalid block ID format",
    }
  ),
});

export type GetBlockByIdInput = z.infer<typeof getBlockByIdSchema>;


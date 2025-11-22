import { z } from "zod";
import mongoose from "mongoose";

// Схема для получения зон по ID блока
export const getZonesByBlockIdSchema = z.object({
  blockId: z.string().refine(
    (val) => mongoose.Types.ObjectId.isValid(val),
    {
      message: "Invalid block ID format",
    }
  ),
});

export type GetZonesByBlockIdInput = z.infer<typeof getZonesByBlockIdSchema>;


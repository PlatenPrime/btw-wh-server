import mongoose from "mongoose";
import { z } from "zod";

export const deleteZoneByIdSchema = z.object({
  id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid zone ID format",
  }),
});

export type DeleteZoneByIdInput = z.infer<typeof deleteZoneByIdSchema>;







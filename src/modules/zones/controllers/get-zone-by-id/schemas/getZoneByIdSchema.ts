import mongoose from "mongoose";
import { z } from "zod";

export const getZoneByIdSchema = z.object({
  id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid zone ID format",
  }),
});

export type GetZoneByIdInput = z.infer<typeof getZoneByIdSchema>;







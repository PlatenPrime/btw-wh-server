import mongoose from "mongoose";
import { z } from "zod";

const objectIdString = z
  .string()
  .refine((value) => mongoose.Types.ObjectId.isValid(value), {
    message: "Invalid ObjectId format",
  });

export const upsertSegsSchema = z
  .array(
    z.object({
      _id: objectIdString.optional(),
      blockId: objectIdString,
      order: z.number().int().min(1, "Order must be at least 1"),
      zones: z
        .array(objectIdString)
        .min(1, "At least one zone is required")
        .max(1000, "Zones array is too large"),
    })
  )
  .min(1, "At least one segment entry is required");

export type UpsertSegsInput = z.infer<typeof upsertSegsSchema>;



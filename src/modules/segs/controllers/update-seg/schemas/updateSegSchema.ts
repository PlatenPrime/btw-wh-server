import { z } from "zod";
import mongoose from "mongoose";

export const updateSegSchema = z.object({
  id: z.string().refine(
    (val) => mongoose.Types.ObjectId.isValid(val),
    {
      message: "Invalid segment ID format",
    }
  ),
  order: z.number().int().min(1, "Order must be at least 1").optional(),
  zones: z
    .array(
      z.string().refine(
        (val) => mongoose.Types.ObjectId.isValid(val),
        {
          message: "Invalid zone ID format",
        }
      )
    )
    .min(1, "Segment must contain at least one zone")
    .optional(),
});

export type UpdateSegInput = z.infer<typeof updateSegSchema>;


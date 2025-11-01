import mongoose from "mongoose";
import { z } from "zod";

export const updateArtLimitSchema = z.object({
  id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid art ID format",
  }),
  limit: z
    .number({
      required_error: "limit is required",
      invalid_type_error: "limit must be a number",
    })
    .nonnegative("limit must be a non-negative number"),
});

export type UpdateArtLimitInput = z.infer<typeof updateArtLimitSchema>;


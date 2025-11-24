import mongoose from "mongoose";
import { z } from "zod";

export const createSegSchema = z.object({
  blockData: z.object({
    _id: z
      .string()
      .refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid block ID format",
      })
      .transform((val) => val),
    title: z.string().min(1, "Block title is required"),
  }),
  order: z.number().int().min(1, "Order must be at least 1"),
  zones: z
    .array(
      z.string().refine(
        (val) => mongoose.Types.ObjectId.isValid(val),
        {
          message: "Invalid zone ID format",
        }
      )
    )
    .min(1, "Segment must contain at least one zone"),
});

export type CreateSegInput = z.infer<typeof createSegSchema>;


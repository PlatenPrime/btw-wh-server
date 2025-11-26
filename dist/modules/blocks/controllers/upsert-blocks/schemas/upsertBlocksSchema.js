import mongoose from "mongoose";
import { z } from "zod";
const objectIdString = z
    .string()
    .refine((value) => mongoose.Types.ObjectId.isValid(value), {
    message: "Invalid ObjectId format",
});
export const upsertBlocksSchema = z
    .array(z.object({
    _id: objectIdString.optional(),
    title: z.string().min(1, "Title is required"),
    order: z.number().int().min(1, "Order must be at least 1"),
    segs: z
        .array(objectIdString)
        .max(1000, "Segments array is too large")
        .optional(),
}))
    .min(1, "At least one block entry is required");

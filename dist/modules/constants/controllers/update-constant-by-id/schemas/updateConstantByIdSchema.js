import mongoose from "mongoose";
import { z } from "zod";
const oneWord = z
    .string()
    .min(1)
    .regex(/^\S+$/, "Name must be a single word (no spaces)")
    .optional();
export const updateConstantByIdSchema = z.object({
    id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid constant ID format",
    }),
    name: oneWord,
    title: z.string().min(1).optional(),
    data: z.record(z.string(), z.string()).optional(),
});

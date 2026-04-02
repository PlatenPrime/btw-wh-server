import mongoose from "mongoose";
import { z } from "zod";
export const updateArtByIdSchema = z
    .object({
    id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid art ID format",
    }),
    limit: z
        .number({
        invalid_type_error: "limit must be a number",
    })
        .nonnegative("limit must be a non-negative number")
        .optional(),
    prodName: z.string().optional(),
})
    .refine((data) => data.limit !== undefined || data.prodName !== undefined, {
    message: "At least one of limit or prodName is required",
    path: ["body"],
});

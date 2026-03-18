import mongoose from "mongoose";
import { z } from "zod";
export const deleteVariantByIdSchema = z.object({
    id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid variant ID format",
    }),
});

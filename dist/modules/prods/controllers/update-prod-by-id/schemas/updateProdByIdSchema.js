import mongoose from "mongoose";
import { z } from "zod";
export const updateProdByIdSchema = z.object({
    id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid prod ID format",
    }),
    name: z.string().min(1).optional(),
    title: z.string().min(1).optional(),
    imageUrl: z.string().min(1).optional(),
});

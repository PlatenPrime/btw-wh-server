import mongoose from "mongoose";
import { z } from "zod";
export const updateDelTitleSchema = z.object({
    id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid del ID format",
    }),
    title: z.string().min(1, "Title is required"),
});

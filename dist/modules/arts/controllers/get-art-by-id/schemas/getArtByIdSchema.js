import mongoose from "mongoose";
import { z } from "zod";
export const getArtByIdSchema = z.object({
    id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid art ID format",
    }),
});

import mongoose from "mongoose";
import { z } from "zod";
export const getAskByIdSchema = z.object({
    id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid ask ID format",
    }),
});

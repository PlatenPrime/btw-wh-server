import mongoose from "mongoose";
import { z } from "zod";
export const completeAskByIdSchema = z.object({
    id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid ask ID format",
    }),
    solverId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid solver ID format",
    }),
});

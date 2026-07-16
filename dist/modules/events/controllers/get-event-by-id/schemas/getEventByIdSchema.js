import mongoose from "mongoose";
import { z } from "zod";
export const getEventByIdSchema = z.object({
    id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid event ID format",
    }),
});

import mongoose from "mongoose";
import { z } from "zod";
export const getAnalogByIdSchema = z.object({
    id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid analog ID format",
    }),
});

import mongoose from "mongoose";
import { z } from "zod";
export const getRowByIdSchema = z.object({
    id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid row ID format",
    }),
});

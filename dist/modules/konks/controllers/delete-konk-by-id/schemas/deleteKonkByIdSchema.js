import mongoose from "mongoose";
import { z } from "zod";
export const deleteKonkByIdSchema = z.object({
    id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid konk ID format",
    }),
});

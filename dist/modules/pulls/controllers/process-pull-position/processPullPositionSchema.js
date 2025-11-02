import mongoose from "mongoose";
import { z } from "zod";
export const processPullPositionSchema = z.object({
    askId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid ask ID format",
    }),
    actualQuant: z.number().positive("Actual quantity must be greater than 0"),
    actualBoxes: z.number().int().min(0, "Actual boxes must be 0 or greater"),
    solverId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid solver ID format",
    }),
});

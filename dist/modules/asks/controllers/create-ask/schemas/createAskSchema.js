import mongoose from "mongoose";
import { z } from "zod";
export const createAskSchema = z.object({
    artikul: z.string().min(1, "Artikul is required"),
    nameukr: z.string().optional(),
    quant: z.number().optional(),
    com: z.string().optional(),
    sklad: z.enum(["pogrebi", "merezhi"]).optional(),
    askerId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid asker ID format",
    }),
});

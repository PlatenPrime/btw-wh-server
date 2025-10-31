import mongoose from "mongoose";
import { z } from "zod";
export const createAskSchema = z.object({
    artikul: z.string().min(1, "Artikul is required"),
    nameukr: z.string().optional(),
    quant: z.preprocess((v) => {
        if (v === "" || v === null || v === undefined) {
            return undefined;
        }
        const num = Number(v);
        return isNaN(num) ? v : num;
    }, z.union([z.number(), z.undefined()]).optional()),
    com: z.string().optional(),
    askerId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid asker ID format",
    }),
});

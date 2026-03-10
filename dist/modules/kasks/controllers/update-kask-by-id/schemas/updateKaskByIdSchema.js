import mongoose from "mongoose";
import { z } from "zod";
export const updateKaskByIdParamsSchema = z.object({
    id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid kask ID format",
    }),
});
export const updateKaskBodySchema = z
    .object({
    artikul: z.string().min(1).optional(),
    nameukr: z.string().min(1).optional(),
    quant: z.number().optional(),
    zone: z.string().min(1).optional(),
    com: z.string().min(1).optional(),
})
    .refine((obj) => Object.keys(obj).length > 0, {
    message: "At least one field must be provided for update",
});

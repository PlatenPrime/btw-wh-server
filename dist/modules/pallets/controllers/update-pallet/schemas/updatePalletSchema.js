import mongoose from "mongoose";
import { z } from "zod";
export const updatePalletSchema = z.object({
    id: z
        .string()
        .refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid pallet ID format",
    }),
    title: z.string().min(1).optional(),
    rowId: z
        .string()
        .refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid rowId format",
    })
        .optional(),
    poses: z
        .array(z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid pose ID format",
    }))
        .optional(),
    sector: z.string().optional(),
    isDef: z.boolean().optional(),
});

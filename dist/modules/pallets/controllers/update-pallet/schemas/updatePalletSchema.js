import mongoose from "mongoose";
import { z } from "zod";
export const updatePalletSchema = z.object({
    id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
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
    // Accept sector as string/number from client but store as number
    sector: z.coerce.number().int().nonnegative().optional(),
    isDef: z.boolean().optional(),
});

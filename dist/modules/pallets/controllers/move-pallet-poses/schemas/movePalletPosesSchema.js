import mongoose from "mongoose";
import { z } from "zod";
export const movePalletPosesSchema = z.object({
    sourcePalletId: z
        .string()
        .refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid sourcePalletId format",
    }),
    targetPalletId: z
        .string()
        .refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid targetPalletId format",
    }),
    isDef: z.boolean().optional(),
});

import mongoose from "mongoose";
import { z } from "zod";
export const getPalletByIdSchema = z.object({
    id: z
        .string()
        .refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid pallet ID format",
    }),
});

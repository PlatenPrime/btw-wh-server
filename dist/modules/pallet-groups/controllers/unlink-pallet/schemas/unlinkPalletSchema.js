import mongoose from "mongoose";
import { z } from "zod";
export const unlinkPalletSchema = z.object({
    palletId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid pallet ID format",
    }),
});

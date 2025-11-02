import mongoose from "mongoose";
import { z } from "zod";
/**
 * Schema for get pull by pallet ID endpoint
 */
export const getPullByPalletIdSchema = z.object({
    palletId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid pallet ID format",
    }),
});

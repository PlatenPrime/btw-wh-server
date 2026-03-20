import mongoose from "mongoose";
import { z } from "zod";
export const getSkuByIdSchema = z.object({
    id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid sku ID format",
    }),
});

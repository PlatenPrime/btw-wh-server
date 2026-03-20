import mongoose from "mongoose";
import { z } from "zod";
export const deleteSkuByIdSchema = z.object({
    id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid sku ID format",
    }),
});

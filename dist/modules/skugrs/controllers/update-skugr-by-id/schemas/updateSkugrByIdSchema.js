import mongoose from "mongoose";
import { z } from "zod";
export const updateSkugrByIdSchema = z.object({
    id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid skugr ID format",
    }),
    konkName: z.string().min(1).optional(),
    prodName: z.string().min(1).optional(),
    title: z.string().min(1).optional(),
    url: z.string().url("Url must be a valid URL").optional(),
});

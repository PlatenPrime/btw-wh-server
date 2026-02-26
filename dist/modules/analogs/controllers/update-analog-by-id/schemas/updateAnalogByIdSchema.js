import mongoose from "mongoose";
import { z } from "zod";
export const updateAnalogByIdSchema = z
    .object({
    id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid analog ID format",
    }),
    konkName: z.string().min(1).optional(),
    prodName: z.string().min(1).optional(),
    artikul: z.string().optional(),
    nameukr: z.string().optional(),
    url: z.string().min(1).optional(),
    title: z.string().optional(),
    imageUrl: z.string().optional(),
})
    .refine((data) => {
    const keys = Object.keys(data).filter((k) => k !== "id");
    return keys.some((k) => data[k] !== undefined);
}, "At least one field must be provided for update");

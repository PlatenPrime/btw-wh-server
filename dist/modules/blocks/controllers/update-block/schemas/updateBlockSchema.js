import { z } from "zod";
import mongoose from "mongoose";
// Схема для обновления блока
export const updateBlockSchema = z.object({
    title: z.string().min(1, "Title is required").optional(),
    order: z.number().int().min(1, "Order must be at least 1").optional(),
    segs: z
        .array(z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid segment ID format",
    }))
        .optional(), // Массив ObjectId сегментов
});

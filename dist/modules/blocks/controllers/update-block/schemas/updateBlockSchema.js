import { z } from "zod";
import mongoose from "mongoose";
// Схема для обновления зоны в блоке
const zoneUpdateSchema = z.object({
    zoneId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid zone ID format",
    }),
    order: z.number().int().min(1, "Order must be at least 1"),
});
// Схема для обновления блока
export const updateBlockSchema = z.object({
    title: z.string().min(1, "Title is required").optional(),
    order: z.number().int().min(1, "Order must be at least 1").optional(),
    zones: z.array(zoneUpdateSchema).optional(),
});

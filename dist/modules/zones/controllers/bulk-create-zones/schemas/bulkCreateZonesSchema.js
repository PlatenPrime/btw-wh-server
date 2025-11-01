import { z } from "zod";
// Базовый паттерн для валидации title (1-3 числовых сегмента)
const titlePattern = /^\d{1,2}(-\d{1,2}){0,2}$/;
// Схема для массового создания зон (Excel импорт)
export const bulkCreateZonesSchema = z.object({
    zones: z
        .array(z.object({
        title: z
            .string()
            .min(1, "Title is required")
            .regex(titlePattern, 'Title must be in format: 1-3 numeric segments (e.g., "42-1", "22-5-1", "42-13-2")'),
        bar: z
            .number()
            .int("Bar must be an integer")
            .positive("Bar must be a positive number"),
        sector: z
            .number()
            .int("Sector must be an integer")
            .min(0, "Sector must be non-negative")
            .optional(),
    }))
        .min(1, "At least one zone is required"),
});

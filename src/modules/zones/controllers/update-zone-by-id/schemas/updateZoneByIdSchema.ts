import { z } from "zod";

// Базовый паттерн для валидации title (1-3 числовых сегмента)
const titlePattern = /^\d{1,2}(-\d{1,2}){0,2}$/;

// Схема для обновления зоны (все поля опциональны)
export const updateZoneSchema = z
  .object({
    title: z
      .string()
      .min(1, "Title is required")
      .regex(
        titlePattern,
        'Title must be in format: 1-3 numeric segments (e.g., "42-1", "22-5-1", "42-13-2")'
      )
      .optional(),
    bar: z
      .number()
      .int("Bar must be an integer")
      .positive("Bar must be a positive number")
      .optional(),
    sector: z
      .number()
      .int("Sector must be an integer")
      .min(0, "Sector must be non-negative")
      .optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    "At least one field must be provided for update"
  );

// Типы для экспорта
export type UpdateZoneInput = z.infer<typeof updateZoneSchema>;


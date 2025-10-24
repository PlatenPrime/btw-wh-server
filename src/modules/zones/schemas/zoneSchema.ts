import { z } from "zod";

// Базовый паттерн для валидации title (1-3 числовых сегмента)
const titlePattern = /^\d{1,2}(-\d{1,2}){0,2}$/;

// Схема для создания зоны
export const createZoneSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .regex(
      titlePattern,
      'Title must be in format: 1-3 numeric segments (e.g., "42-1", "22-5-1", "42-13-2")'
    ),
  bar: z
    .number()
    .int("Bar must be an integer")
    .positive("Bar must be a positive number"),
  sector: z
    .number()
    .int("Sector must be an integer")
    .min(0, "Sector must be non-negative")
    .default(0),
});

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

// Схема для массового создания зон (Excel импорт)
export const bulkCreateZonesSchema = z.object({
  zones: z
    .array(
      z.object({
        title: z
          .string()
          .min(1, "Title is required")
          .regex(
            titlePattern,
            'Title must be in format: 1-3 numeric segments (e.g., "42-1", "22-5-1", "42-13-2")'
          ),
        bar: z
          .number()
          .int("Bar must be an integer")
          .positive("Bar must be a positive number"),
        sector: z
          .number()
          .int("Sector must be an integer")
          .min(0, "Sector must be non-negative")
          .optional(),
      })
    )
    .min(1, "At least one zone is required"),
});

// Схема для параметров запроса getAllZones
export const getAllZonesQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => val > 0, "Page must be positive"),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .refine((val) => val > 0 && val <= 100, "Limit must be between 1 and 100"),
  search: z.string().optional().default(""),
  sortBy: z
    .enum(["title", "bar", "sector", "createdAt"])
    .optional()
    .default("sector"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
});

// Типы для экспорта
export type CreateZoneInput = z.infer<typeof createZoneSchema>;
export type UpdateZoneInput = z.infer<typeof updateZoneSchema>;
export type BulkCreateZonesInput = z.infer<typeof bulkCreateZonesSchema>;
export type GetAllZonesQuery = z.infer<typeof getAllZonesQuerySchema>;

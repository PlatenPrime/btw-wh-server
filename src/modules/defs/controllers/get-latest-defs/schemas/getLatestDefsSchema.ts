import { z } from "zod";

/**
 * Схема валидации для получения последних дефицитов
 * GET запрос не требует параметров, поэтому схема пустая
 */
export const getLatestDefsSchema = z.object({});

export type GetLatestDefsInput = z.infer<typeof getLatestDefsSchema>;


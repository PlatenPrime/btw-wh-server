import { z } from "zod";

/**
 * Схема валидации для расчета дефицитов
 * POST запрос не требует параметров, поэтому схема пустая
 */
export const calculatePogrebiDefsSchema = z.object({});

export type CalculatePogrebiDefsInput = z.infer<
  typeof calculatePogrebiDefsSchema
>;


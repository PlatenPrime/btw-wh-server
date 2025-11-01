import { z } from "zod";

/**
 * Схема валидации для получения статуса расчета
 * GET запрос не требует параметров, поэтому схема пустая
 */
export const getCalculationStatusSchema = z.object({});

export type GetCalculationStatusInput = z.infer<
  typeof getCalculationStatusSchema
>;


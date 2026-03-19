import { z } from "zod";

export const getYumiGroupPagesProductsSchema = z.object({
  // URL первой страницы группы (например, ".../page_1" может отсутствовать,
  // а первая страница может быть просто ".../group-url").
  groupUrl: z.string().min(1, "groupUrl is required").url("Invalid URL"),

  // Защита от бесконечных циклов при аномальной пагинации.
  // Если сайт возвращает первую страницу после конца — мы остановимся уже
  // по `visited`, но `maxPages` добавляет ещё один предохранитель.
  maxPages: z.number().int().min(1).max(200).optional(),
});

export type GetYumiGroupPagesProductsInput = z.infer<
  typeof getYumiGroupPagesProductsSchema
>;


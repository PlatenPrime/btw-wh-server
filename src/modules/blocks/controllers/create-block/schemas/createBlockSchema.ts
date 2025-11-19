import { z } from "zod";

// Схема для создания блока
export const createBlockSchema = z.object({
  title: z.string().min(1, "Title is required"),
});

export type CreateBlockInput = z.infer<typeof createBlockSchema>;


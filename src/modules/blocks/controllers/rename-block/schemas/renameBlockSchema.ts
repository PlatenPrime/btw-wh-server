import { z } from "zod";

// Схема для переименования блока
export const renameBlockSchema = z.object({
  title: z.string().min(1, "Title is required"),
});

export type RenameBlockInput = z.infer<typeof renameBlockSchema>;


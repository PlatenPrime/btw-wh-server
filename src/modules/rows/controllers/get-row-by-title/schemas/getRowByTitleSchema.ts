import { z } from "zod";

export const getRowByTitleSchema = z.object({
  title: z.string().min(1, "Title is required"),
});

export type GetRowByTitleInput = z.infer<typeof getRowByTitleSchema>;


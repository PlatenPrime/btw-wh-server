import { z } from "zod";

export const createRowSchema = z.object({
  title: z.string().min(1, "Title is required"),
});

export type CreateRowInput = z.infer<typeof createRowSchema>;


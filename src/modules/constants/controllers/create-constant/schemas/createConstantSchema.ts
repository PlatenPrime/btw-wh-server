import { z } from "zod";

/** Строка одним словом (без пробелов) */
const oneWord = z
  .string()
  .min(1, "Name is required")
  .regex(/^\S+$/, "Name must be a single word (no spaces)");

export const createConstantSchema = z.object({
  name: oneWord,
  title: z.string().min(1, "Title is required"),
  data: z.record(z.string(), z.string()).default({}),
});

export type CreateConstantInput = z.infer<typeof createConstantSchema>;

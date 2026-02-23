import { z } from "zod";

export const getKonkByNameSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export type GetKonkByNameInput = z.infer<typeof getKonkByNameSchema>;

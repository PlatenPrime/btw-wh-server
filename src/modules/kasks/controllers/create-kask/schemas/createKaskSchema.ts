import { z } from "zod";

export const createKaskSchema = z.object({
  artikul: z.string().min(1, "Artikul is required"),
  nameukr: z.string().min(1, "Nameukr is required"),
  quant: z.number(),
  zone: z.string().min(1, "Zone is required"),
  com: z.string().min(1, "Com is required"),
});

export type CreateKaskInput = z.infer<typeof createKaskSchema>;

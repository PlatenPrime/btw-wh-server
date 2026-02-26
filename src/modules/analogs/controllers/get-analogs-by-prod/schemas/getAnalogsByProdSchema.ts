import { z } from "zod";

export const getAnalogsByProdSchema = z.object({
  prodName: z.string().min(1, "prodName is required"),
});

export type GetAnalogsByProdInput = z.infer<typeof getAnalogsByProdSchema>;

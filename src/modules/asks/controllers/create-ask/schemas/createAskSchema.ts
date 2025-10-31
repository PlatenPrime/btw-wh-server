import mongoose from "mongoose";
import { z } from "zod";

export const createAskSchema = z.object({
  artikul: z.string().min(1, "Artikul is required"),
  nameukr: z.string().optional(),
  quant: z
    .preprocess(
      (v) => (v === "" || v === null || v === undefined ? undefined : v),
      z.coerce.number()
    )
    .optional(),
  com: z.string().optional(),
  askerId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid asker ID format",
  }),
});

export type CreateAskInput = z.infer<typeof createAskSchema>;

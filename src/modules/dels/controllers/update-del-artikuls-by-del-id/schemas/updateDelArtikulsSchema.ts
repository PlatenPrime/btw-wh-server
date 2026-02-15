import mongoose from "mongoose";
import { z } from "zod";

export const updateDelArtikulsSchema = z.object({
  id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid del ID format",
  }),
});

export type UpdateDelArtikulsInput = z.infer<typeof updateDelArtikulsSchema>;

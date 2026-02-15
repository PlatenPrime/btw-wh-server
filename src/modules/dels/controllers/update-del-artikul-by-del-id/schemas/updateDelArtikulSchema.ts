import mongoose from "mongoose";
import { z } from "zod";

export const updateDelArtikulSchema = z.object({
  id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid del ID format",
  }),
  artikul: z.string().min(1, "Artikul is required"),
});

export type UpdateDelArtikulInput = z.infer<typeof updateDelArtikulSchema>;

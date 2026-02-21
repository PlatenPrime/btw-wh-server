import mongoose from "mongoose";
import { z } from "zod";

export const getProdByIdSchema = z.object({
  id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid prod ID format",
  }),
});

export type GetProdByIdInput = z.infer<typeof getProdByIdSchema>;

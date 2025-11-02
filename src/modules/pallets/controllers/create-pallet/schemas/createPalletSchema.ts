import mongoose from "mongoose";
import { z } from "zod";

export const createPalletSchema = z.object({
  title: z.string().min(1, "Title is required"),
  rowData: z.object({
    _id: z
      .string()
      .refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid row ID format",
      })
      .transform((val) => val),
    title: z.string().min(1, "Row title is required"),
  }),
  sector: z.string().optional(),
  isDef: z.boolean().optional(),
});

export type CreatePalletInput = z.infer<typeof createPalletSchema>;







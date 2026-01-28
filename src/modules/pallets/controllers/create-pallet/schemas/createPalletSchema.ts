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
  // Accept sector from the client as string or number but always coerce to number
  sector: z.coerce.number().int().nonnegative().optional(),
  isDef: z.boolean().optional(),
});

export type CreatePalletInput = z.infer<typeof createPalletSchema>;

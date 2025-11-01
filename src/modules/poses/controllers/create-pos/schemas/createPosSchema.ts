import mongoose from "mongoose";
import { z } from "zod";

export const createPosSchema = z.object({
  palletId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid pallet ID",
  }),
  rowId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid row ID",
  }),
  artikul: z.string(),
  nameukr: z.string().optional(),
  quant: z.number(),
  boxes: z.number(),
  date: z.string().optional(),
  sklad: z.string().optional(),
  comment: z.string().optional(),
});

export type CreatePosInput = z.infer<typeof createPosSchema>;


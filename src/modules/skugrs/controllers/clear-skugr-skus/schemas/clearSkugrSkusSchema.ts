import mongoose from "mongoose";
import { z } from "zod";

export const clearSkugrSkusSchema = z.object({
  id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid skugr ID format",
  }),
});

export type ClearSkugrSkusInput = z.infer<typeof clearSkugrSkusSchema>;

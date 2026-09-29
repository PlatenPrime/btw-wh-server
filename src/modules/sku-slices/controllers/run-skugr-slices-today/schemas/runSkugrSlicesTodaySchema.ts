import mongoose from "mongoose";
import { z } from "zod";

export const runSkugrSlicesTodaySchema = z.object({
  skugrId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid skugr ID format",
  }),
});

export type RunSkugrSlicesTodayInput = z.infer<
  typeof runSkugrSlicesTodaySchema
>;

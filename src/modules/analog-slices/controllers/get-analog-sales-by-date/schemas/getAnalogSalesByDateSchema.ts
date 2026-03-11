import mongoose from "mongoose";
import { z } from "zod";
import { dateStringSchema } from "../../common/schemas/dateSchema.js";

export const getAnalogSalesByDateSchema = z.object({
  analogId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid analog ID format",
  }),
  date: dateStringSchema,
});

export type GetAnalogSalesByDateInput = z.infer<
  typeof getAnalogSalesByDateSchema
>;

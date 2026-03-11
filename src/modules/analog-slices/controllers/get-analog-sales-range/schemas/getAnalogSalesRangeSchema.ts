import mongoose from "mongoose";
import { z } from "zod";
import { dateStringSchema } from "../../common/schemas/dateSchema.js";

export const getAnalogSalesRangeSchema = z
  .object({
    analogId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
      message: "Invalid analog ID format",
    }),
    dateFrom: dateStringSchema,
    dateTo: dateStringSchema,
  })
  .refine((data) => data.dateFrom.getTime() <= data.dateTo.getTime(), {
    message: "dateFrom must be before or equal to dateTo",
    path: ["dateTo"],
  });

export type GetAnalogSalesRangeInput = z.infer<typeof getAnalogSalesRangeSchema>;

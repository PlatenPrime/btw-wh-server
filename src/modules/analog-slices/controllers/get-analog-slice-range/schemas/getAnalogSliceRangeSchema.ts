import mongoose from "mongoose";
import { z } from "zod";

const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD")
  .transform((s) => {
    const d = new Date(s + "T00:00:00.000Z");
    if (Number.isNaN(d.getTime())) throw new Error("Invalid date");
    return d;
  });

export const getAnalogSliceRangeSchema = z
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

export type GetAnalogSliceRangeInput = z.infer<typeof getAnalogSliceRangeSchema>;

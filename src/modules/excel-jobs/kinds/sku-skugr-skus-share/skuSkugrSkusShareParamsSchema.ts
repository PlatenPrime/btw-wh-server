import mongoose from "mongoose";
import { z } from "zod";
import { includeImagesSchema } from "../../../sku-reporting/schemas/includeImagesSchema.js";

function isUtcCalendarDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

const ymdSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD")
  .refine(isUtcCalendarDate, { message: "Invalid date" });

export const skuSkugrSkusShareParamsSchema = z
  .object({
    skugrId: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
      message: "Invalid skugr ID format",
    }),
    dateFrom: ymdSchema,
    dateTo: ymdSchema,
    sortBy: z.enum(["sales", "revenue"]).optional(),
    includeImages: includeImagesSchema,
  })
  .strict()
  .refine((data) => data.dateFrom <= data.dateTo, {
    message: "dateFrom must be before or equal to dateTo",
    path: ["dateTo"],
  });

export type SkuSkugrSkusShareParams = z.infer<typeof skuSkugrSkusShareParamsSchema>;
